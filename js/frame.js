// ==============================
//  設定・定数系
// ==============================
let app;

// 各キャラクターのtxt(json難読化後のファイル)読み込み
async function loadData() {
    // console.log("loadData start");

    const params = new URLSearchParams(location.search);
    // console.log("params ok");

    const character = params.get('char') || 'lili';
    // console.log("character =", character);

    const response = await fetch(`data/${character}.txt`);
        // console.log("before fetch");

    const base64 = await response.text();
    const binary = atob(base64);
    const bytes = Uint8Array.from(
        binary,
        c => c.charCodeAt(0)
    );

    const jsonText =
        new TextDecoder('utf-8').decode(bytes);

    return JSON.parse(jsonText);
}

// ページのタイトル
async function updatePageTitle(characterId) {
    const response = await fetch('data/characters.json');
    const characters = await response.json();
    const character = characters.find(
            c => c.id === characterId
        );
    if (!character) return;
    document.title = `${character.jpName} (${character.name}) フレーム表 - 鉄拳8フレーム情報DB KOBUSHISM`;

    // メタ情報
    const desc = document.querySelector(
        'meta[name="description"]'
    );
    if (desc) {
        desc.content = `鉄拳8 ${character.jpName}のフレーム表。発生・ガード・ヒット・カウンター・ヒートシステムを掲載。`;
    }
}

// 項目名変換表
const labelMap = {
    "no": "No.", "name": "技名", "yomi": "読み", "command": "コマンド(文字)",
    "parsed": "コマンド", "judge": "判定", "damage": "ダメージ", "startup": "発生",
    "active": "持続", "total": "全体", "guard": "ガード", "hit": "ヒット",
    "counter": "カウンター", "status1": "HM", "status2": "TR", "status3": "PW",
    "status4": "HE", "status5": "HT", "status6": "ER", "status7": "JS",
    "status8": "CS", "status9": "WB", "status10": "FB", "status": "ステータス",
    "note1": "備考1", "note2": "備考2", "note3": "備考3", "note": "備考",
    "extra1": "予備1", "extra2": "予備2", "extra3": "予備3", "extra": "予備"
};

// ステータス項目
const statusKeys = ['HM','TR','PW','HE','HT','ER','JS','CS','WB','FB'];

// ステータス項目に紐づくカラーコード
const statusColors = {
    'HM': '#2196F3','TR': '#FF5252','PW': '#C62828','HE': '#B000FF',
    'HT': '#7C4DFF','ER': '#FF8F00','JS': '#D81B60','CS': '#00838F',
    'WB': '#00C853','FB': '#FFD600','RH': '#2196F3','LH': '#2196F3',
    'RA': '#C62828','HB': '#B000FF','HD': '#7C4DFF','HS': '#7C4DFF'
};

// ===== statusキー固定（安全版） =====
const statusSourceKeys = [
    'status1','status2','status3','status4','status5',
    'status6','status7','status8','status9','status10'
];

// ===== status説明 =====
let statusInfoMap = {};

async function loadStatuses() {
    const response = await fetch("data/statuses.json");
    const statuses = await response.json();
    statusInfoMap = {};
    statuses.forEach(status => {
        statusInfoMap[status.code] = {
            title: status.title,
            description: status.description
        };
    });
}

// ===== フレーム関連説明 =====
const frameTokenInfoMap  = {
    Sm: {description: '尻もちやられ(強制しゃがみ、ガード可能な硬直)'},
    HE: {description: 'ヒートダッシュ時のみ'},
    S: {description: '強制しゃがみ'},
    G: {description: 'ガード可能な硬直'},
    K: {description: 'きりもみやられ(ガード可能な硬直)'},
    W: {description: '壁よろけ誘発やられ(ガード可能な硬直)'},
    A: {description: 'ハーフ浮きやられ(追撃で空中コンボ)'},
    Y: {description: '相手側面取り'},
    B: {description: '相手背面取り'}
};

// モード一覧
const VIEW_MODES = {
    MOBILE: 'MobileView',
    COMPACT: 'CompactView',
    LIST: 'ListView'
};

// ===============================
// columns定義（displayMode別）
// ===============================

// 列順番（記載無いと描画されない）
const columnOrder = ['no','name','parsed','judge','damage','startup','active','total','guard','hit','counter','status','note'];

// CompactView列情報
const columnsCompact = {
    no: { label: 'No.', render: renderNo },
    name: { label: '技名 / コマンド', render: renderName },
    judge: { label: '判定 / ダメージ', render: renderJudge },
    startup: { label: '発生', render: renderStartup },
    active: { label: '持続', render: renderActive },
    total: { label: '全体', render: renderTotal },
    guard: { label: 'ガード', render: renderGuard },
    hit: { label: 'ヒット', render: renderHit },
    counter: { label: 'カウンター', render: renderCounter },
    status: { label: 'ステータス', render: renderStatus },
    note: { label: '備考', render: renderNote }
};

// listView列情報
const columnsList = {
    no: { label: 'No.', render: renderNo },
    name: { label: '技名', render: renderName },
    parsed: { label: 'コマンド', render: renderParsed },
    judge: { label: '判定', render: renderJudge },
    damage: { label: 'ダメージ', render: renderDamage },
    startup: { label: '発生', render: renderStartup },
    active: { label: '持続', render: renderActive },
    total: { label: '全体', render: renderTotal },
    guard: { label: 'ガード', render: renderGuard },
    hit: { label: 'ヒット', render: renderHit },
    counter: { label: 'カウンター', render: renderCounter },
    status: { label: 'ステータス', render: renderStatus },
    note: { label: '備考', render: renderNote }
};

// MobileView列情報
const columnsMobile = {
    name: {
        label: '技情報',
        render: (item) => {
            return createStack(
                processNameNode(item.name), // ← DOM版に変更
                (() => {
                    const wrapper = document.createElement('div');

                    // コマンド
                    const cmd = document.createElement('div');
                    cmd.appendChild(createParsedNode(item.parsed));
                    wrapper.appendChild(cmd);

                    // 判定 + ダメージ
                    const jd = document.createElement('div');
                    jd.appendChild(processJudgeNode(item.judge));
                    jd.appendChild(document.createTextNode(' / '));
                    jd.appendChild(processDamageNode(item.damage));
                    wrapper.appendChild(jd);

                    // フレーム
                    const frame = document.createElement('div');
                    frame.appendChild(document.createTextNode(`発生:${item.startup ?? ""} / ガード:${item.guard ?? ""}`));
                    wrapper.appendChild(frame);

                    return wrapper;
                })(),
                {
                    topTitle: item.yomi || null
                }
            );
        }
    }
};


// ==============================
//  計測・ユーティリティ系
// ==============================

// ===== text width cache =====
const textMeasureCanvas = document.createElement('canvas');
const textMeasureCtx = textMeasureCanvas.getContext('2d');
const textWidthCache = new Map();
textMeasureCtx.font = '16px "Noto Sans JP", sans-serif';

// ===== テキスト幅計測（textWidth） =====
// ：改行位置計算に使う文字列の描画幅をcanvasで取得（DOMを使わない）
function getTextWidth(text) {
    if (textWidthCache.has(text)) return textWidthCache.get(text);
    const width = textMeasureCtx.measureText(text).width;

    textWidthCache.set(text, width);
    return width;
}

// ===== 最後のイベントから一定時間経過後にのみ処理を実行する（debounce） =====
// ：resize/input連打対策
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ===== 安全対策処理 =====
// ：null,型事故防止、img src安全化
// 描画処理
function safeRender(colDef, item, mode) {
    try {
        if (!colDef?.render) return "";

        const result = colDef.render(item, mode);

        if (result instanceof Node) return result; // HTMLElement → Node に書き換え
        return result ?? "";

    } catch (e) {
        // console.error('render error:', colDef?.label, e);
        return "";
    }
}

// 文字列系レンダラー共通ガード
function safeText(val) {
    if (val instanceof Node) return val;
    return val ?? "";
}

// 画像idを安全にinnerHTMLへ流す
function safeImageId(id) {
    return /^[a-zA-Z0-9_-]+$/.test(id) ? id : "";
}

// ===== 安全モード取得 =====
function getSafeMode(mode) {
    return mode === 'CompactView' ? 'CompactView' : 'ListView';
}


// ==============================
//  State管理系（今の表示状態を持つ）
// ==============================

// ：
class AppState {
    constructor(data = []) {
        this.data = data;
        // 'ListView' | 'CompactView' | 'MobileView'
        this.displayMode = 'CompactView';
        this.searchQuery = '';
        this.searchTarget = 'all';
        this.fixedColumnIndexes = new Set();
    }
}

// ：init（初期化）,render呼び出し、state管理
class AppController {
    constructor(data) {
        this.state = new AppState(data);
    }

    init() {
        setupEventListeners(this);
        this.render();
    }

    render() {
        initTable(this.state);
    }
}


// ==============================
//  イベント管理系（ユーザー操作受付）
// ==============================

// ===== DOM要素にイベント登録 =====
// ：UIイベント管理（検索,view切替,theme切替,リサイズ対応）
function setupEventListeners(app) {
    // =====================================
    // 検索UI
    // =====================================
    const searchInput = document.getElementById('searchInput');
    const searchFilterButton = document.getElementById('searchFilterButton');
    const searchFilterPanel = document.getElementById('searchFilterPanel');
    const searchTargetLabels = {
        all: '全体',
        name: '技名',
        command: 'コマンド',
        judge: '判定',
        damage: 'ダメージ',
        startup: '発生',
        guard: 'ガード',
        hit: 'ヒット',
        counter: 'カウンター',
        status: 'ステータス',
        note: '備考'
    };

    // -----------------------------
    // 検索入力
    // -----------------------------
    if (searchInput) {
        searchInput.addEventListener(
            'input',
            debounce((e) => {
                app.state.searchQuery =
                    e.target.value;
                app.render();
            }, 150)
        );
    }

    // -----------------------------
    // Tune押下
    // -----------------------------
    if (
        searchFilterButton &&
        searchFilterPanel
    ) {
        searchFilterButton.addEventListener(
            'click',
            (e) => {
                e.stopPropagation();
                searchFilterPanel.classList.toggle(
                    'open'
                );
            }
        );
    }

    // -----------------------------
    // 項目選択
    // -----------------------------
    document
        .querySelectorAll(
            '#searchFilterPanel button'
        )
        .forEach(button => {
            button.addEventListener(
                'click',
                () => {
                    const target = button.dataset.target;
                    app.state.searchTarget = target;
                    searchInput.placeholder = `${searchTargetLabels[target]}を検索`;
                    searchFilterPanel.classList.remove(
                        'open'
                    );
                    app.render();
                }
            );
        });

    // -----------------------------
    // 外側クリックで閉じる
    // -----------------------------
    document.addEventListener(
        'click',
        (e) => {
            if (
                !searchFilterPanel.contains(e.target) &&
                !searchFilterButton.contains(e.target)
            ) {
                searchFilterPanel.classList.remove(
                    'open'
                );
            }
        }
    );
    // =====================================
    // view切替
    // =====================================

    const viewToggle = document.getElementById('viewModeToggle');
    const viewLabel = document.getElementById('viewModeLabel');
    const cardControls = document.getElementById('cardControls');

    function updateViewUI() {
        if (!viewToggle) return;
        const isMobile = isMobileDevice();

        // -----------------------------
        // 表示モード
        // -----------------------------
        app.state.displayMode =
            isMobile
                ? (
                    viewToggle.checked
                        ? 'MobileView'
                        : 'CompactView'
                )
                : (
                    viewToggle.checked
                        ? 'CompactView'
                        : 'ListView'
                );

        // -----------------------------
        // ラベル
        // -----------------------------
        if (viewLabel) {
            if (isMobile) {
                viewLabel.textContent =
                    viewToggle.checked
                        ? 'モバイル表示'
                        : 'コンパクト表示';
            } else {
                viewLabel.textContent =
                    viewToggle.checked
                        ? 'コンパクト表示'
                        : 'リスト表示';
            }
        }

        // -----------------------------
        // カード開閉
        // Mobile + MobileViewのみ表示
        // -----------------------------
        if (cardControls) {
            const showControls =
                isMobile &&
                viewToggle.checked;
            cardControls.style.display =
                showControls
                    ? 'flex'
                    : 'none';
        }
    }

    if (viewToggle) {
        viewToggle.addEventListener(
            'change',
            () => {
                app.state.fixedColumnIndexes.clear();
                updateViewUI();
                app.render();
            }
        );
        updateViewUI();
    }

    // =====================================
    // theme切替
    // =====================================
    const themeToggle = document.getElementById('themeModeToggle');
    const themeLabel = document.getElementById('themeModeLabel');

    if (themeToggle) {
        themeToggle.addEventListener(
            'change',
            (e) => {
                const isDark =
                    e.target.checked;
                document.body.classList.toggle(
                    'dark-mode',
                    isDark
                );
                if (themeLabel) {
                    themeLabel.textContent =
                        isDark
                            ? 'ダークモード'
                            : 'ライトモード';
                }
                applyStickyColumns(app.state);
            }
        );
    }

    // =====================================
    // カード開閉
    // =====================================
    const toggleCardsButton = document.getElementById('toggleCardsButton');

    if (toggleCardsButton) {
        toggleCardsButton.addEventListener(
            'click',
            toggleAllCards
        );
    }

    // =====================================
    // 設定パネル
    // =====================================
    const settingsButton = document.getElementById('settingsButton');
    const settingsPanel = document.getElementById('settingsPanel');

    if (settingsButton && settingsPanel) {
        settingsButton.addEventListener(
            'click',
            (e) => {
                e.stopPropagation();
                settingsPanel.classList.toggle('open');
            }
        );

        document.addEventListener(
            'click',
            (e) => {
                if (
                    !settingsPanel.contains(e.target) &&
                    !settingsButton.contains(e.target)
                ) {
                    settingsPanel.classList.remove('open');
                }
            }
        );
    }

    // =====================================
    // サイドメニュー
    // =====================================
    const menuButton = document.getElementById('menuButton');
    const menuDrawer = document.getElementById('menuDrawer');
    const menuOverlay = document.getElementById('menuOverlay');

    if (
        menuButton &&
        menuDrawer &&
        menuOverlay
    ) {
        menuButton.addEventListener(
            'click',
            () => {
                const isOpen =
                    menuDrawer.classList.contains('open');
                menuDrawer.classList.toggle(
                    'open',
                    !isOpen
                );
                menuOverlay.classList.toggle(
                    'open',
                    !isOpen
                );
            }
        );

        menuOverlay.addEventListener(
            'click',
            () => {
                menuDrawer.classList.remove('open');
                menuOverlay.classList.remove('open');
            }
        );
    }

    // =====================================
    // リサイズ
    // =====================================
    let lastMobileState = isMobileDevice();

    window.addEventListener(
        'resize',
        debounce(() => {
            const currentMobile = isMobileDevice();
            if (currentMobile !== lastMobileState) {
                lastMobileState =
                    currentMobile;
                updateViewUI();
                app.render();
                // requestAnimationFrame(() => {
                //     applyStickyColumns(app.state);
                // });
                requestAnimationFrame(() => {
                    applyStickyColumns(state);

                    setTimeout(() => {
                        applyStickyColumns(state);
                    }, 500);
                });
            }
        }, 150)
    );

    // =====================================
    // Scroll To Top Button(ページ上部に戻るボタン)
    // =====================================
    const scrollTopButton = document.getElementById('scrollToTopButton');
    const mainContainer = document.getElementById('main-container');

    if (scrollTopButton && mainContainer) {
        // -----------------------------
        // スクロール監視
        // -----------------------------
        mainContainer.addEventListener(
            'scroll',
            debounce(() => {
                const show = mainContainer.scrollTop > 200;
                scrollTopButton.classList.toggle(
                    'visible',
                    show
                );
            }, 10)
        );

        // -----------------------------
        // TOPへ戻る
        // -----------------------------
        scrollTopButton.addEventListener(
            'click',
            () => {
                mainContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        );
    }

}
// ===== toggleイベント =====
// ：開閉UI

// サブヘッダー（「ヒートシステム」「通常技」など）の開閉機能
function toggleSection(headerRow) {
    headerRow.classList.toggle('collapsed');
    let nextRow = headerRow.nextElementSibling;
    // 「次の行が存在する」かつ「その行が次のサブヘッダーではない」間、処理を繰り返す
    while (nextRow && !nextRow.classList.contains('sub-header')) {
        nextRow.classList.toggle('hidden-row');
        nextRow = nextRow.nextElementSibling;
    }
}

// MobileView（カード表示）の開閉機能
function toggleMobileCard(card) {
    card.classList.toggle('collapsed');
}

// 開く/閉じるボタン処理
let allCardsOpened = false;
function toggleAllCards() {
    allCardsOpened = !allCardsOpened;
    document.querySelectorAll('.mobile-card').forEach(card => {
        card.classList.toggle(
            'collapsed',
            !allCardsOpened
        );
    });
    const btn =
        document.getElementById('toggleCardsButton');
    if (btn) {
        btn.textContent =
            allCardsOpened
                ? 'すべて閉じる'
                : 'すべて開く';
    }
}


// ==============================
//  描画エントリーポイント（画面を組み立てる中心）
// ==============================

// このアプリの「メインレンダラー」
// ： テーブル初期化 > mode判定 > columns取得 > header生成 > row生成 > cell生成 > 描画 > sticky適用 > chips更新
function initTable(state) {

    const headerRow = document.getElementById('table-header');
    const tableBody = document.getElementById('table-body');

    headerRow.innerHTML = '';
    // while (headerRow.firstChild) { headerRow.removeChild(headerRow.firstChild); } //innerHTMLを完全に消す場合はコレに書き換え
    tableBody.innerHTML = '';
    // while (tableBody.firstChild) { tableBody.removeChild(tableBody.firstChild); } //innerHTMLを完全に消す場合はコレに書き換え

    const displayData = state.data;
    if (!displayData.length) return;

    // // モード補正
    // const mobileToggle = document.getElementById('viewModeToggle');
    // const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // if (isMobile) {
    //     state.displayMode = mobileToggle?.checked
    //         ? 'MobileView'
    //         : 'CompactView';

    // } else {
    //     state.displayMode = mobileToggle?.checked
    //         ? 'CompactView'
    //         : 'ListView';
    // }
    // ↑の処理はsetupEventListeners()側に一任するから不要？

    const columns = getColumnsByMode(state.displayMode);
    const keys = Object.keys(columns);

    const fragment = document.createDocumentFragment();

    // ===== ヘッダー =====
    keys.forEach((key, idx) => {
        const th = document.createElement('th');
        th.setAttribute('data-key', key);
        th.textContent = columns[key].label;

        th.onclick = () => {
            if (state.fixedColumnIndexes.has(idx)) {
                state.fixedColumnIndexes.delete(idx);
            } else {
                state.fixedColumnIndexes.add(idx);
            }
            applyStickyColumns(state);
        };

        headerRow.appendChild(th);
    });

    let currentSubHeaderName = "";
    let currentSubHeader = null;
    let subHeaderHasMatch = false;

    displayData.forEach((item) => {

        const isSubHeader = item.no && /[一-龠ぁ-んァ-ヶ]/.test(item.no);

        if (isSubHeader) {

            currentSubHeaderName = item.no;

            const tr = document.createElement('tr');
            tr.classList.add('sub-header');

            const td = document.createElement('td');
            td.colSpan = keys.length;

            const content = document.createElement('div');
            content.className = 'sub-header-content';
            content.textContent = item.no;

            td.appendChild(content);
            tr.appendChild(td);

            tr.onclick = () => toggleSection(tr);

            fragment.appendChild(tr);

            currentSubHeader = tr;
            subHeaderHasMatch = false;

        } else {

            const tr = document.createElement('tr');
            // const isVisible = matchesSearch(item, app.state.searchQuery,app.state.searchTarget);
            const isVisible = true;

            if (!isVisible) tr.classList.add('hidden-row');
            else subHeaderHasMatch = true;

            if (state.displayMode === 'MobileView') {
                const td = document.createElement('td');
                td.colSpan = keys.length;
                td.appendChild(renderMobileCard(item, currentSubHeaderName));
                tr.appendChild(td);
                fragment.appendChild(tr);
                return;
            }

            const skipKeys = new Set();
            const itemData = { ...item };

            // ===== ヒートシステム判定 =====
            const isHeatSystem = (currentSubHeaderName === "ヒートシステム");

            const guardValue = isHeatSystem && itemData['total']
                ? itemData['total']
                : itemData['guard'];

            for (let i = 0; i < keys.length; i++) {

                const key = keys[i];
                if (skipKeys.has(key)) continue;

                // ===== ヒート処理 =====
                const heatCell = handleHeatSystemCell({
                    key,
                    keys,
                    keyIndexMap: Object.fromEntries(keys.map((k, idx) => [k, idx])),
                    itemData,
                    skipKeys,
                    isHeatSystem,
                    guardValue
                });

                if (heatCell) {
                    tr.appendChild(heatCell);
                    continue;
                }

                // ===== 通常描画 =====
                const td = document.createElement('td');
                td.setAttribute('data-key', key);

                // ---------------------------------
                // guard画像化
                // ---------------------------------
                if (
                    key === 'guard' &&
                    Array.isArray(itemData.guard_parsed)
                ) {
                    td.appendChild(
                        createParsedNode(itemData.guard_parsed)
                    );
                } else {
                    const content =
                        safeRender(
                            columns[key],
                            itemData,
                            state.displayMode
                        );

                    if (content instanceof Node) {
                        td.appendChild(content);
                    } else {
                        td.textContent = content ?? "";
                    }
                }
                tr.appendChild(td);
            }
            fragment.appendChild(tr);
        }
    });

    tableBody.appendChild(fragment);

    if (!subHeaderHasMatch && currentSubHeader) {
        currentSubHeader.classList.add('hidden-row');
    }

    requestAnimationFrame(() => applyStickyColumns(state));
    updateChips(state);
}


// ==============================
//  カラム描画系（render群、各列をどう表示するか）
// ==============================

// ===== 基本render =====
// ：render系は「データ」 > 「DOMへ変換」だけを担当

// --- no ---
function renderNo(item) {
    return item?.no ?? "";
}

// --- name ---
function renderName(item, mode) {
    const nameNode = processNameNode(item.name);
    const parsed = createParsedNode(item.parsed);

    if (mode === 'CompactView') {
        return createStack(
            nameNode,
            parsed,
            {
                topTitle: item.yomi || null
            }
        );
    }

    const div = document.createElement('div');
    div.appendChild(nameNode);

    if (item.yomi) {
        div.title = item.yomi;
        div.classList.add('name-cell-hint');
    }

    return div;
}

// --- parsed ---
function renderParsed(item, mode) {
    if (mode === 'CompactView') return "";
    return createParsedNode(item?.parsed);
}

// --- judge ---
function renderJudge(item, mode) {
    if (mode === 'CompactView') {
        return createStack(
            processJudgeNode(item.judge),
            processDamageNode(item.damage)
        );
    }

    return processJudgeNode(item.judge);
}

// --- damage ---
function renderDamage(item, mode) {
    if (mode === 'CompactView') return "";
    return processDamageNode(item.damage);
}

// --- startup ---
function renderStartup(item) {
    const val = item?.startup ?? "";
    // 例: 16(20) → 16 / (20)
    return createSplitNode(val, /(?=\()/);
}

// --- active ---
function renderActive(item) {
    const val = item?.active ?? "";
    return createSplitNode(val, /(?=\()/);
}

// --- total ---
function renderTotal(item) {
    const val = item?.total ?? "";
    return createSplitNode(val, /(?=\()/);
}

// --- guard ---
function renderGuard(item) {
    return createFrameDataNode(item?.guard ?? "");
}

// --- hit ---
function renderHit(item) {
    return createFrameDataNode(item?.hit ?? "");
}

// --- counter ---
function renderCounter(item) {
    return createFrameDataNode(item?.counter ?? "");
}

// --- status ---
function renderStatus(item) {
    const container = document.createElement('div');
    container.className = 'status-container';

    statusSourceKeys.forEach((sKey, idx) => {
        const val = item?.[sKey];
        if (!val) return;

        let label = statusKeys[idx];
        let text = val;

        if (sKey === 'status1' && (val === 'LH' || val === 'RH')) {
            label = val;
        } else if (sKey === 'status3' && (val === 'RA')) {
            label = val;
        } else if (sKey === 'status4' && (val === 'HB')) {
            label = val;
        } else if (sKey === 'status5' && (val === 'HD' || val === 'HS')) {
            label = val;
        } else if (val !== label && !val.includes(':')) {
            text = `${label}:${val}`;
        }

        const badge = createStatusBadge(text);
        if (badge) container.appendChild(badge);
    });

    return container;
}

// --- note ---
function renderNote(item) {
    const fragment = document.createDocumentFragment();

    const keys = ['note1', 'note2', 'note3'];
    let hasContent = false;

    keys.forEach((k) => {
        const rawVal = item?.[k];
        const parsedVal = item?.[`${k}_parsed`];

        // 空欄判定
        const hasRaw =
            typeof rawVal === 'string' &&
            rawVal.trim() !== '';

        const hasParsed =
            Array.isArray(parsedVal) &&
            parsedVal.length > 0;
        // 両方空ならスキップ
        if (!hasRaw && !hasParsed) return;
        hasContent = true;

        // 行ラッパー
        const line = document.createElement('span');

        // 先頭の ・（中点）
        line.appendChild(
            document.createTextNode('・')
        );

        // parsed優先
        if (parsedVal) {
            line.appendChild(
                renderNoteParsed(parsedVal)
            );
        }

        // fallback
        else {
            line.appendChild(
                document.createTextNode(rawVal.trim())
            );
        }

        fragment.appendChild(line);

        // 改行
        fragment.appendChild(
            document.createElement('br')
        );

    });

    // 最後の余計な br 削除
    if (hasContent && fragment.lastChild?.nodeName === 'BR') {
        fragment.removeChild(fragment.lastChild);
    }

    return fragment;
}


// =====================================================
// note parsed描画
// =====================================================
function renderNoteParsed(parsedParts) {

    if (!Array.isArray(parsedParts)) {
        return "";
    }

    const root = document.createDocumentFragment();

    for (const part of parsedParts) {

        // 通常テキスト
        if (part.type === "text") {

            root.appendChild(
                document.createTextNode(part.text || "")
            );

        }
        // コマンド
        else if (part.type === "command") {
            const cmdWrapper = document.createElement("span");
            cmdWrapper.className = "note-command";

            for (const token of (part.parsed || [])) {
                // 画像あり
                if (token.id) {
                    cmdWrapper.appendChild(
                        createIcon(token.id, token.char)
                    );
                }
                // 通常文字
                else {
                    cmdWrapper.appendChild(
                        document.createTextNode(token.char || "")
                    );
                }
            }
            root.appendChild(cmdWrapper);
        }
    }
    return root;
}

// ==============================
//  DOM生成系（HTML文字列を使わずDOM生成）
// ==============================

// ===== 汎用DOM =====
// --- 共通UI ---
function createStack(topContent, bottomContent, options = {}) {
    const {
        topTitle = null,
        topClass = '',
        bottomClass = ''
    } = options;

    const container = document.createElement('div');
    container.className = 'stack-container';

    // --- top ---
    const top = document.createElement('div');
    top.className = 'stack-top' + (topClass ? ` ${topClass}` : '');

    if (topContent instanceof Node) {
        top.appendChild(topContent);
    } else {
        top.textContent = topContent || "";
    }

    if (topTitle) {
        top.title = topTitle;
        top.classList.add('name-cell-hint');
    }

    // --- bottom ---
    const bottom = document.createElement('div');
    bottom.className = 'stack-bottom' + (bottomClass ? ` ${bottomClass}` : '');

    if (bottomContent instanceof Node) {
        bottom.appendChild(bottomContent);
    } else {
        bottom.textContent = bottomContent || "";
    }

    container.appendChild(top);
    container.appendChild(bottom);

    return container;
}

// --- 分割 → DOM生成ヘルパー ---
function createSplitNode(text, splitRegex) {
    if (typeof text !== 'string') {
        return document.createTextNode("");
    }

    const fragment = document.createDocumentFragment();
    const parts = text.split(splitRegex);

    parts.forEach((part, index) => {
        if (part) {
            const span = document.createElement('span');
            span.textContent = part;
            fragment.appendChild(span);
        }

        if (index < parts.length - 1) {
            fragment.appendChild(document.createElement('br'));
        }
    });

    return fragment;
}

// --- mobile用ラベル関数 ---
function createLabeledRow(labels, values) {
    const row = document.createElement('div');
    row.className = 'mobile-row labeled';

    labels.forEach((label, i) => {
        const cell = document.createElement('div');

        const labelEl = document.createElement('div');
        labelEl.className = 'mobile-label';
        labelEl.textContent = label;

        const valueEl = document.createElement('div');
        valueEl.className = 'mobile-value';

        const v = values[i];

        if (v instanceof Node) {
            valueEl.appendChild(v);
        } else if (v != null) {
            valueEl.textContent = String(v);
        }

        cell.appendChild(labelEl);
        cell.appendChild(valueEl);
        row.appendChild(cell);
    });

    return row;
}

// ===== 改行系 =====
// --- 改行位置決定 ---
function smartLineBreakIndex(text, maxWidth, options = {}) {
    if (!text) return -1;

    const {
        breakChars = [" ", "～", "(", "/", ","]
    } = options;

    if (getTextWidth(text) <= maxWidth) return -1;

    let bestIndex = -1;
    let bestScore = Infinity;

    for (let i = 0; i < text.length; i++) {
        if (!breakChars.includes(text[i])) continue;

        const line1 = text.slice(0, i);
        const line2 = text.slice(i);

        const w1 = getTextWidth(line1);
        const w2 = getTextWidth(line2);

        if (w1 <= maxWidth && w2 <= maxWidth) {
            const diff = Math.abs(w1 - w2);
            if (diff < bestScore) {
                bestScore = diff;
                bestIndex = i;
            }
        }
    }

    if (bestIndex !== -1) return bestIndex;

    return Math.floor(text.length / 2);
}

// --- 改行挿入 ---
function createLineBreakNode(text, maxWidth, options = {}) {
    if (!text) return document.createTextNode("");

    const index = smartLineBreakIndex(text, maxWidth, options);

    if (index === -1) {
        return document.createTextNode(text);
    }

    const fragment = document.createDocumentFragment();

    const before = text.slice(0, index);
    const after = text.slice(index);

    fragment.appendChild(document.createTextNode(before));
    fragment.appendChild(document.createElement('br'));
    fragment.appendChild(document.createTextNode(after));

    return fragment;
}

// ===== parsed系 =====
// --- コマンドの改行処理ロジック①：改行位置を特定する「計算機」 ---
function smartParsedBreakIndex(parsedData, maxWidth) {
    if (!parsedData || parsedData.length === 0) return -1;

    // アイコン幅の数値化(1.5em、テキストなら「実際の描画幅」)
    const rootFontSize =
        parseFloat(getComputedStyle(document.documentElement).fontSize);
    const iconWidth = rootFontSize * 1.5;
    const widths = parsedData.map(p =>
        p.id ? iconWidth : getTextWidth(p.char)
    );

    // 累積幅の作成(全てのパーツの幅を順番に足して、「n番目のパーツ時点での合計幅」をリスト化)
    const prefix = [0];
    for (let i = 0; i < widths.length; i++) {
        prefix[i + 1] = prefix[i] + widths[i];
    }

    const totalWidth = prefix[prefix.length - 1];
    if (totalWidth <= maxWidth) return -1;

    // 「最もバランスが良い改行位置」の探索処理
    let bestIndex = -1;
    let bestScore = Infinity;
    let bestPriority = -1;

    for (let i = 0; i < parsedData.length; i++) {
        const ch = parsedData[i].char;
        let priority = -1;
        let breakAt = i;

        // ---------------------------------
        // "(or"区切り(強度：強)
        // ---------------------------------
        if (
            ch === "(" &&
            parsedData[i + 1]?.char === "o" &&
            parsedData[i + 2]?.char === "r"
        ) {
            priority = 100;
            // "(" の前で改行
            breakAt = i - 1;
        // ---------------------------------
        // "/"区切り(強度：中)
        // ---------------------------------
        } else if (ch === "/") {
            priority = 50;
        // ---------------------------------
        // "スペース"区切り(強度：弱)
        // ---------------------------------
        } else if (ch === " ") {
            priority = 10;
        } else {
            continue;
        }

        const w1 = prefix[breakAt + 1];
        const w2 = totalWidth - prefix[breakAt + 1];

        if (w1 <= maxWidth && w2 <= maxWidth) {
            const diff = Math.abs(w1 - w2);
            // priority優先
            if (
                priority > bestPriority ||
                (
                    priority === bestPriority &&
                    diff < bestScore
                )
            ) {
                bestPriority = priority;
                bestScore = diff;
                bestIndex = breakAt;
            }
        }
    }

    return bestIndex;
}

// --- コマンドの改行処理ロジック②：DOM生成を分離する ---
function createParsedNode(parsedData, maxWidth = 400) {

    if (!Array.isArray(parsedData)) {
        return document.createTextNode("");
    }

    const container = document.createElement('span');
    container.className = 'parsed-container';

    const breakIndex =
        smartParsedBreakIndex(parsedData, maxWidth);

    parsedData.forEach((part, index) => {

        container.appendChild(
            createParsedPart(part, part.char)
        );

        // このtokenの後で改行
        if (index === breakIndex) {
            container.appendChild(
                document.createElement('br')
            );
        }
    });

    return container;
}

// --- パーツ生成を統一 ---
function createParsedPart(part, text) {
    if (part.id) {
        return createIcon(part.id, text);
    }
    return createTextSpan(text);
}

// --- コマンドテキスト補助関数 ---
function createTextSpan(text) {
    const span = document.createElement('span');
    span.className = 'command-text';
    span.textContent = text; // ← 完全安全
    return span;
}

// --- コマンドアイコン補助関数 ---
// Googleドライブの画像を読み込むver
// function createIcon(id, alt) {
//     const img = document.createElement('img');
//     img.className = 'command-icon';

//     const safeId = safeImageId(id);
//     if (!safeId) return document.createTextNode('');

//     img.loading = 'lazy'; // 画面外なら後で読み込む
//     img.decoding = 'async'; // 画像デコードで描画を止めにくくする

//     img.src = `https://lh3.googleusercontent.com/d/${safeId}`;
//     img.alt = alt || '';

//     return img;
// }
// githubnの画像を読み込むver
function createIcon(iconName, alt = '') {
    const COMMAND_ICON_BASE_URL = 'https://wacchi2940.github.io/wacchi2940-tekken8-frame-db-kobushism/images/Command';
    const img = document.createElement('img');

    img.className = 'command-icon';
    img.src = `${COMMAND_ICON_BASE_URL}/${iconName}`;
    img.alt = alt;

    img.loading = 'lazy'; // 画面外なら後で読み込む
    img.decoding = 'async'; // 画像デコードで描画を止めにくくする

    img.onerror = () => {
        img.style.display = 'none';
    };
    return img;
}

// --- guard/hit/counter用tooltip付きテキスト生成関数 ---
function createFrameDataNode(text) {

    if (!text) {
        return document.createTextNode("");
    }

    const container = document.createElement('span');

    // "/"区切り維持
    const lines = text.split('/');

    // 長いトークンを優先してマッチ
    const tokenList = Object.keys(frameTokenInfoMap)
        .sort((a, b) => b.length - a.length);

    lines.forEach((line, lineIndex) => {

        const row = document.createElement('span');

        let i = 0;

        while (i < line.length) {

            let matched = false;

            for (const token of tokenList) {

                if (line.startsWith(token, i)) {

                    const info = frameTokenInfoMap[token];

                    const tooltip = document.createElement('span');
                    tooltip.className = 'frame-tooltip-token';

                    tooltip.textContent = token;

                    tooltip.title = `${info.description}`;

                    row.appendChild(tooltip);

                    i += token.length;
                    matched = true;

                    break;
                }
            }

            // 通常文字
            if (!matched) {

                row.appendChild(
                    document.createTextNode(line[i])
                );

                i++;
            }
        }

        container.appendChild(row);

        // "/"ごとに改行
        if (lineIndex < lines.length - 1) {
            container.appendChild(document.createElement('br'));
        }
    });

    return container;
}

// ===== status系 =====
// --- ステータス情報のバッチアイコン化 ---
function createStatusBadge(text) {
    if (!text) return null;

    const label = text.includes(':')
        ? text.split(':')[0]
        : text; // label変数に「:」前の文字列を入れる

    const badge = document.createElement('span');

    badge.className = 'status-badge';
    badge.textContent = text;

    badge.style.backgroundColor =
        statusColors[label] || '#9e9e9e'; // ステータスカラーコードを参照して色付け

    const info = statusInfoMap[label];

    if (info) {
        badge.title = `${info.title}\n${info.description}`;
    }

    badge.dataset.status = label;

    return badge;
}

// ===== mobile系 =====
// --- Mobileヘッダー生成 ---
function createMobileHeader(item) {
    const header = document.createElement('div');
    header.className = 'mobile-header';

    const textWrap = document.createElement('div');
    textWrap.className = 'mobile-header-text';

    // --- name ---
    const nameEl = document.createElement('div');
    nameEl.className = 'mobile-name';
    nameEl.appendChild(processNameNode(item.name));

    // --- parsed ---
    const parsedEl = document.createElement('div');
    parsedEl.className = 'mobile-parsed';
    parsedEl.appendChild(createParsedNode(item.parsed));

    textWrap.appendChild(nameEl);
    textWrap.appendChild(parsedEl);

    // --- icon ---
    const icon = document.createElement('div');
    icon.className = 'mobile-toggle-icon';
    icon.textContent = '▶';

    header.appendChild(textWrap);
    header.appendChild(icon);

    return header;
}

// --- Mobileカード生成 ---
function renderMobileCard(item) {
    const card = document.createElement('div');
    card.className = 'mobile-card collapsed';

    // ===== ヘッダー =====
    const header = createMobileHeader(item);
    header.onclick = () => {
        card.classList.toggle('collapsed');
    };

    // ===== ボディ =====
    const body = document.createElement('div');
    body.className = 'mobile-body';

    // --- フレーム ---
    body.appendChild(
        createLabeledRow(
            ['発生', '持続', '全体'],
            [
                renderStartup(item), // 既存が文字列ならNode化
                renderActive(item),
                renderTotal(item)
            ]
        )
    );

    // --- 判定 / ダメージ ---
    body.appendChild(
        createLabeledRow(
            ['判定', 'ダメージ', ''],
            [
                processJudgeNode(item.judge),
                processDamageNode(item.damage),
                document.createTextNode('') // 空セル
            ]
        )
    );

    // --- 下段 ---
    body.appendChild(
        createLabeledRow(
            ['ガード', 'ヒット', 'カウンター'],
            [
                // document.createTextNode(item.guard ?? ''), // 他の書き方に統一
                renderGuard(item),
                renderHit(item),
                renderCounter(item)
            ]
        )
    );

    // --- status ---
    const status = document.createElement('div');
    status.className = 'mobile-status';
    status.appendChild(renderStatus(item));
    body.appendChild(status);

    // --- note ---
    const note = document.createElement('div');
    note.className = 'mobile-note';
    note.appendChild(renderNote(item));
    body.appendChild(note);

    card.appendChild(header);
    card.appendChild(body);

    return card;
}


// ==============================
//  データ加工系（表示前に情報整理）
// ==============================

// ===== process系 =====
// ： 専用ルール適用 > createLineBreakNode呼び出し

// name 専用ラッパー
function processNameNode(name) {
    return createLineBreakNode(name, 400, {
        breakChars: ["～", "(", " "]
    });
}

// judge 専用ラッパー
function processJudgeNode(judge) {
    return createLineBreakNode(judge, 290);
}

// damage 専用ラッパー
function processDamageNode(damage) {
    return createLineBreakNode(damage, 290, {
        breakChars: [" ", "(", "/"]
    });
}


// ==============================
//  表示制御系（見え方調整）
// ==============================

// ===== Sticky =====
function applyStickyColumns(state) {

    const table = document.getElementById('data-table');
    const headerRow = document.getElementById('table-header');

    if (!headerRow) return;

    const totalCols = headerRow.cells.length;
    const halfPoint = totalCols / 2;

    const leftFixed = [...state.fixedColumnIndexes]
        .filter(i => i < halfPoint)
        .sort((a,b)=>a-b);

    const rightFixed = [...state.fixedColumnIndexes]
        .filter(i => i >= halfPoint)
        .sort((a,b)=>b-a);

    // ===== 幅先読み =====
    const widths = [];

    for (let i = 0; i < totalCols; i++) {
        // widths[i] = headerRow.cells[i]?.offsetWidth || 0;
        const cell = headerRow.cells[i];
        if (
            !cell ||
            cell.offsetParent === null
        ) {
            widths[i] = 0;
            continue;
        }
        widths[i] = cell.getBoundingClientRect().width;
    }

    // ===== stickyセルだけリセット =====
    table.querySelectorAll('.sticky-column').forEach(cell => {
        cell.classList.remove(
            'sticky-column',
            'sticky-column-right'
        );

        cell.style.left = '';
        cell.style.right = '';
    });

    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {

        if (row.classList.contains('sub-header')) return;

        let left = 0;

        leftFixed.forEach(idx => {

            const cell = row.cells[idx];

            if (!cell) return;

            cell.classList.add('sticky-column');
            cell.style.transform = "translateZ(0)"; // テスト
            cell.style.backgroundColor = "green"; // テスト
            cell.style.left = `${left}px`;

            left += widths[idx];
        });

        let right = 0;

        rightFixed.forEach(idx => {

            const cell = row.cells[idx];

            if (!cell) return;

            cell.classList.add(
                'sticky-column',
                'sticky-column-right'
            );

            cell.style.right = `${right}px`;

            right += widths[idx];
        });
    });
}

// ===== Search =====
function matchesSearch(item, query, target = 'all') {

    if (!query) return true;
    const q = query.toLowerCase().normalize('NFKC').replace(/\s/g, '');
    const normalize = (v) =>
        (v || '')
            .toLowerCase()
            .replace(/\s/g, '');

    // -------------------------
    // name
    // -------------------------
    if (target === 'name' || target === 'all') {
        const name = normalize(item.name);
        const yomi = normalize(item.yomi);
        if (name.includes(q) || yomi.includes(q)) {
            return true;
        }
    }

    // -------------------------
    // command
    // -------------------------
    if (target === 'command' || target === 'all') {
        const command = normalize(item.command);
        if (command.includes(q)) {
            return true;
        }
    }

    // -------------------------
    // judge
    // -------------------------
    if (target === 'judge' || target === 'all') {
        const judge = normalize(item.judge);
        if (judge.includes(q)) {
            return true;
        }
    }

    // -------------------------
    // damage
    // -------------------------
    if (target === 'damage' || target === 'all') {
        const damage = normalize(item.damage);
        if (damage.includes(q)) {
            return true;
        }
    }

    // -------------------------
    // startup
    // -------------------------
    if (target === 'startup' || target === 'all') {
        const startup = normalize(item.startup);
        if (startup === q) {
            return true;
        }
    }

    // -------------------------
    // guard
    // -------------------------
    if (target === 'guard' || target === 'all') {
        const guard = normalize(item.guard);
        if (guard.includes(q)) {
            return true;
        }
    }

    // -------------------------
    // hit
    // -------------------------
    if (target === 'hit' || target === 'all') {
        const hit = normalize(item.hit);
        if (hit.includes(q)) {
            return true;
        }
    }

    // -------------------------
    // counter
    // -------------------------
    if (target === 'counter' || target === 'all') {
        const counter = normalize(item.counter);
        if (counter.includes(q)) {
            return true;
        }
    }
    
    // -------------------------
    // status
    // -------------------------
    if (target === 'status' || target === 'all') {
        for (let i = 1; i <= 10; i++) {
            const status = item[`status${i}`] || '';
            const statusVal = status.toLowerCase();
            // status値そのもの
            if (statusVal === q) return true;
            // 列ラベル
            const defaultLabel = statusKeys[i-1].toLowerCase();
            if (status && defaultLabel.includes(q)) return true;
        }
    }

    // -------------------------
    // note
    // -------------------------
    if (target === 'note' || target === 'all') {
        for (let i = 1; i <= 3; i++) {
            const note = normalize(item[`note${i}`]);
            if (note.includes(q)) {
                return true;
            }
        }
    }
    return false;
}

// ===== Heat特殊処理 =====
function handleHeatSystemCell({
    key,
    keys,
    keyIndexMap,
    itemData,
    skipKeys,
    isHeatSystem,
    guardValue
}) {
    if (!isHeatSystem) return null;

    // ============================
    // judge ～ total を結合
    // ============================
    if (key === 'judge') {
        const start = keyIndexMap['judge'];
        const end = keyIndexMap['total'];

        if (start !== undefined && end !== undefined && end >= start) {
            const td = document.createElement('td');

            td.colSpan = end - start + 1;
            td.className = 'merged-cell-content';
            td.style.borderRight = "1px solid var(--border-color)";
            td.textContent = itemData['judge'] || "";

            for (let k = start + 1; k <= end; k++) {
                skipKeys.add(keys[k]);
            }

            return td;
        }
    }

    // ============================
    // guard ～ counter を結合
    // ============================
    if (key === 'guard') {
        const start = keyIndexMap['guard'];
        const end = keyIndexMap['counter'];

        if (start !== undefined && end !== undefined && end >= start) {
            const td = document.createElement('td');

            td.colSpan = end - start + 1;
            td.className = 'merged-cell-content';
            td.style.textAlign = 'left';
            td.style.borderRight = "1px solid var(--border-color)";

            // =========================
            // total_parsed を描画(ヒートシステムの詳細に含まれるコマンドを画像化)
            // =========================
            const parsed = itemData['total_parsed'];
            if (parsed && parsed.length > 0) {
                const parsedContainer = document.createElement('span');
                parsed.forEach(token => {
                    // 通常テキスト
                    if (token.type === 'text') {
                        const text = token.text.replace(/,/g, '');
                        parsedContainer.appendChild(
                            document.createTextNode(text)
                        );
                    // コマンド
                    } else if (token.type === 'command') {
                        parsedContainer.appendChild(
                            createParsedNode(token.parsed)
                        );
                    }
                });
                td.appendChild(parsedContainer);

            } else {

                td.textContent = guardValue || "";
            }
            for (let k = start + 1; k <= end; k++) {
                skipKeys.add(keys[k]);
            }
            return td;
        }
    }
    return null;
}

// ===== Columns切替 =====
function getColumnsByMode(mode) {
    switch (mode) {
        case 'MobileView': return columnsMobile;
        case 'ListView': return columnsList;
        default: return columnsCompact;
    }
}


// ==============================
//  UI補助系（ナビ・補助UI）
// ==============================

// ===== ナビゲーションメニュー（チップ）生成 =====
function updateChips(state) {
    const chipContainer = document.getElementById('chip-container');
    const subHeaders = document.querySelectorAll('.sub-header');
    chipContainer.innerHTML = '';
    // while (chipContainer.firstChild) { chipContainer.removeChild(chipContainer.firstChild); } //innerHTMLを完全に消す場合はコレに書き換え
    subHeaders.forEach((header) => {
        // 表示すべきかどうかの判定（検索連動）
        let hasVisibleRow = false;
        let nextRow = header.nextElementSibling;
        while (nextRow && !nextRow.classList.contains('sub-header')) {
            if (!nextRow.classList.contains('hidden-row')) { hasVisibleRow = true; break; }
            nextRow = nextRow.nextElementSibling;
        }
        if (state.searchQuery && !hasVisibleRow) return;
        // チップ（ボタン）の作成と設定
        const chip = document.createElement('div');
        chip.className = 'nav-chip';
        chip.textContent = header.textContent.trim();
        // クリック時の挙動（自動展開とスクロール）
        chip.onclick = () => {
            const container = document.getElementById('main-container');
            if (header.classList.contains('collapsed')) toggleSection(header);
            container.scrollTo({ top: header.offsetTop - 40, behavior: 'smooth' });
        };
        chipContainer.appendChild(chip);
    });
}

// ===== サイドメニューcharacterMenu生成 =====
async function createCharacterMenu() {
    const currentCharacter = new URLSearchParams(location.search).get("char");
    const response = await fetch("data/characters.json");
    const characters = await response.json();

    const menu = document.getElementById("characterMenu");

    characters.forEach(character => {
        if (character.status !== "ready") return;

        const link = document.createElement("a");

        link.href = `frame.html?char=${character.id}`;

        if (character.id === currentCharacter) {
            link.className = "menu-link active-character";
        } else {
            link.className = "menu-link";
        }
        // link.className = "menu-link";
        // link.textContent = character.name.toUpperCase();
        // menu.appendChild(link);
        link.textContent = character.name;

        menu.appendChild(link);
    });
}

// ===== モバイル判定 =====
// --- 「端末がモバイルかどうか」判定 ---
function isMobileView() {
    return isMobileDevice();
}

// --- 「今モバイル表示にしているか」判定 ---
function isMobileDevice() {
    return window.matchMedia('(max-width: 768px)').matches;
}


// ==============================
//  結果
// ==============================
window.onload = async () => {
    const params = new URLSearchParams(location.search);
    const characterId = params.get('char') || 'lili';
    await updatePageTitle(characterId);
     const data = await loadData();

    await createCharacterMenu();
    await loadStatuses();
    const allJsonData = await loadData();
    app = new AppController(allJsonData);
    app.init();
};
