async function loadStatuses() {
    const response = await fetch("data/statuses.json");
    const statuses = await response.json();
    const container = document.getElementById("statusList");
    container.innerHTML = "";
    statuses.forEach(status => {
        container.innerHTML += `
        <div class="status-item">
            <div class="status-badge bg-${status.code.toLowerCase()}">
                ${status.code}
            </div>
            <div class="status-info">
                <div class="status-name">
                    ${status.title}
                </div>
                <div class="status-detail">
                    ${status.description.replace(/\n/g,"<br>")}
                </div>
            </div>
        </div>
        `;
    });
}
window.onload = loadStatuses;