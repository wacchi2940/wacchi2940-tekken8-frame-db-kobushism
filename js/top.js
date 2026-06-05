// グループごとのセクション構造を生成するヘルパー関数
function renderGroup(groupName, characters, parentContainer, gridClass, latestVersion) {
    const section = document.createElement('section');
    section.className = "season-section";

    const header = document.createElement('div');
    header.className = "group-header";
    
    let titleColorClass = "text-zinc-500";
    if (groupName === "SEASON 1") {
        titleColorClass = "text-amber-500";
    } else if (groupName === "SEASON 2") {
        titleColorClass = "text-emerald-500";
    } else if (groupName === "SEASON 3") {
        titleColorClass = "text-purple-500";
    }

    header.innerHTML = `
        <h3 class="group-title oswald italic ${titleColorClass}">${groupName}</h3>
        <div class="header-line"></div>
    `;
    section.appendChild(header);

    const grid = document.createElement('div');
    grid.className = gridClass;

    characters.forEach(character => {
        if (!character) return;
        const card = document.createElement('div');
        const isReady = character.status === "ready";

        // リンクの有無でカード全体のベーススタイルを切り替え
        if (isReady) {
            card.className = "character-card ready-card";
        } else {
            card.className = "character-card prep-card";
        }
        
        card.onclick = () => {
            // console.log("clicked");
            // console.log(character);
            // console.log(character.id);
            // console.log(isReady);
            if (isReady) {
                window.location.href =
                    `frame.html?char=${character.id}`;
            } else {
                showToast(`「${character.name.toUpperCase()}」のフレーム表は現在準備中です。`);
            }
        };

        const imageUrl = `images/${character.image}`;
        const hasImage = imageUrl !== "";

        // リンクがない(hasLinkがfalse)場合は画像に 'grayscale' クラスを適用する
        const imageFilterClass = isReady ? "" : "grayscale";

        card.innerHTML = `
            <!-- 1. 画像格納エリア (3:4アスペクト比で完全に文字と分離) -->
            <div class="card-image-wrap">
                <div class="card-image-bg"></div>

                <!-- キャラクター画像 -->
                ${hasImage ? `
                <img src="${imageUrl}" 
                        class="card-img ${imageFilterClass}" 
                        alt="${character.name} Portrait" 
                        id="img-${character.name}"
                        onerror="this.style.display='none'; document.getElementById('fallback-icon-${character.name}').style.display='flex';">
                ` : ''}

                <!-- フォールバック用シルエット -->
                <div id="fallback-icon-${character.name}" class="card-fallback" style="${hasImage ? 'display: none;' : 'display: flex;'}">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                </div>
            </div>

            <!-- 2. ネームプレート＆ステータスエリア (画像の外側・下部) -->
            <div class="card-info">
                <!-- キャラクター名 -->
                <div class="card-name oswald">${character.name}</div>

                <!-- ステータスラベル -->
                <div class="card-status">
                    ${
                        isReady
                        ? (() => {
                            const isLatest =
                                compareVersion(
                                    character.ver,
                                    latestVersion
                                ) >= 0;

                            return `
                                <span class="badge ${
                                    isLatest
                                        ? 'badge-ready'
                                        : 'badge-prep'
                                }">
                                    Ver.${character.ver}
                                </span>
                            `;
                        })()
                        : '<span class="badge badge-prep">PREP</span>'
                    }
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });

    section.appendChild(grid);
    parentContainer.appendChild(section);
}

// characters.json読み込み関数
async function loadCharacters() {
    const response = await fetch('data/characters.json');
    return await response.json();
}

// history.json読み込み関数
async function loadHistory() {
    const response = await fetch('data/history.json');
    return await response.json();
}

// version.json読み込み関数
async function loadVersion() {
    const response = await fetch('data/version.json');
    return await response.json();
}

// キャラクター選択カードの描画処理
function renderCharacters(characters, histories, latestVersion) {
    const groupedCharacters = {};
    characters.forEach(character => {
        const season = character.season;
        if (!groupedCharacters[season]) {
            groupedCharacters[season] = [];
        }
        groupedCharacters[season].push(character);

    });

    const mainContainer = document.getElementById('selection-area');
    mainContainer.innerHTML = ""; 

    // 1. BASE GAME（横最大8列表示）
    renderGroup("BASE GAME", groupedCharacters["BASE GAME"], mainContainer, "base-grid", latestVersion);

    // 2. SEASON 1 と SEASON 2 を横並びの2カラム構成にする
    const seasonRow1 = document.createElement('div');
    seasonRow1.className = "season-row-container";
    mainContainer.appendChild(seasonRow1);

    renderGroup("SEASON 1", groupedCharacters["SEASON 1"], seasonRow1, "season-grid", latestVersion);
    renderGroup("SEASON 2", groupedCharacters["SEASON 2"], seasonRow1, "season-grid", latestVersion);

    // 3. SEASON 3 ＆ プレースホルダーの横並び構成
    const seasonRow2 = document.createElement('div');
    seasonRow2.className = "season-row-container";
    mainContainer.appendChild(seasonRow2);

    renderGroup("SEASON 3", groupedCharacters["SEASON 3"], seasonRow2, "season-grid", latestVersion);

    // 余白エリア（SEASON 4 COMING SOON）
    const placeholderBox = document.createElement('div');
    placeholderBox.className = "placeholder-box";
    placeholderBox.innerHTML = `
        <div class="placeholder-title oswald tekken-font">SEASON 4</div>
        <div class="placeholder-subtitle">COMING SOON</div>
    `;
    seasonRow2.appendChild(placeholderBox);

    // 4. 新設：更新履歴（UPDATE HISTORY）セクション
    const historySection = document.createElement('section');
    historySection.className = "history-section";

    const historyItems = histories.map(history => `
        <div class="history-item">
            <div class="history-left">
                <span class="history-date oswald">
                    ${history.date}
                </span>

                <p class="history-text">
                    ${history.text}
                </p>
            </div>

            <span class="history-tag">
                ${history.type}
            </span>
        </div>
    `).join('');
    historySection.innerHTML = `
    <div class="history-title-wrap">
        <h3 class="history-heading oswald italic">
            <span class="history-accent-line"></span>
            UPDATE HISTORY
        </h3>
        <div class="header-line"></div>
    </div>

    <div class="history-container">
        ${historyItems}
    </div>
    `;
    mainContainer.appendChild(historySection);
}

// 自作トースト通知機能
let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    
    toastText.textContent = message;
    
    clearTimeout(toastTimeout);
    
    toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// version比較
function compareVersion(v1, v2) {
    const a = v1.split('.').map(Number);
    const b = v2.split('.').map(Number);
    const len = Math.max(a.length, b.length);

    for (let i = 0; i < len; i++) {
        const x = a[i] || 0;
        const y = b[i] || 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
}

// 初期ロード処理
window.onload = async function() {
    const characters = await loadCharacters();
    const histories = await loadHistory();
    const versionData = await loadVersion();

    // console.log(characters);
    renderCharacters(characters, histories, versionData.latest);

    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }
    }, 500);
};
