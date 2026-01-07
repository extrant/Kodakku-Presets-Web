// ================= 配置区 =================
const API_URL = 'https://rough-dream-f35a.ottocorp.xyz/';
const MAP_JSON_URL = './territory_names.json';

const AUTHOR_MAPPING = {
    "JiaXX": "JiaXX (贾XX)",
    "Cicero 灵视": "Cicero (灵视)",
    "Tetora": "Tetora (南雲鉄虎)"
};
// =========================================

let globalData = {
    presets: [],
    sources: [],
    maps: {}
};

const dom = {
    grid: document.getElementById('gridContainer'),
    status: document.getElementById('networkStatus'),
    searchInput: document.getElementById('searchInput'),
    dungeonFilter: document.getElementById('dungeonFilter'),
    authorFilter: document.getElementById('authorFilter'),
    countTotal: document.getElementById('totalCount'),
    countDisplay: document.getElementById('displayCount')
};

async function initApp() {
    try {
        dom.status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在同步数据...';
        const [presetsRes, mapsRes] = await Promise.all([fetch(API_URL), fetch(MAP_JSON_URL)]);

        if (!presetsRes.ok || !mapsRes.ok) throw new Error("服务器连接失败");

        // 【修复点】在这里定义 data
        const data = await presetsRes.json();
        globalData.presets = data.p; // 压缩后的预设列表
        globalData.sources = data.s; // 在线库地址列表
        globalData.maps = await mapsRes.json();

        initFilters();
        renderCards(globalData.presets);
        
        dom.status.innerHTML = '<i class="fas fa-check-circle" style="color:var(--success)"></i> 数据已更新';
        dom.countTotal.textContent = globalData.presets.length;

    } catch (err) {
        dom.status.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:red"></i> 错误: ${err.message}`;
    }
}

const getAuthorName = (name) => AUTHOR_MAPPING[name] || name;
const getMapName = (id) => globalData.maps[id] || `未知区域 (${id})`;

function initFilters() {
    const authors = new Set(globalData.presets.map(p => p.a));
    Array.from(authors).sort().forEach(auth => {
        dom.authorFilter.add(new Option(getAuthorName(auth), auth));
    });

    const territoryIds = new Set();
    globalData.presets.forEach(p => {
        if (p.t && Array.isArray(p.t)) p.t.forEach(id => territoryIds.add(id));
    });
    
    Array.from(territoryIds).map(id => ({ id, name: getMapName(id) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
        .forEach(m => dom.dungeonFilter.add(new Option(m.name, m.id)));
}

function renderCards(data) {
    dom.grid.innerHTML = '';
    dom.countDisplay.textContent = data.length;
    const fragment = document.createDocumentFragment();

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        const repoUrl = globalData.sources[item.i] || ''; // 获取来源库链接
        const mapTags = (item.t || []).map(id => `<span class="tag-map">${getMapName(id)}</span>`).join('');
        const descText = [item.u, item.o].filter(Boolean).join('\n') || '暂无描述';

        card.innerHTML = `
            <div class="card-body">
                <div class="card-header">
                    <div class="preset-title">${item.n}</div>
                    <div class="version-tag">v${item.v}</div>
                </div>
                <div class="author-info"><i class="fas fa-user-edit"></i> ${getAuthorName(item.a)}</div>
                <div class="tags-container">${mapTags}</div>
                <div class="desc-box">${descText}</div>
            </div>
            <div class="card-footer" style="display: flex; gap: 8px;">
                <button class="btn-copy" style="flex: 1; font-size: 0.8rem;" onclick="handleCopy(this, '${repoUrl}')">
                    <i class="fas fa-archive"></i> 在线库
                </button>
                <button class="btn-copy" style="flex: 1; font-size: 0.8rem; background: #5865F2; color: white;" onclick="handleCopy(this, '${item.d}')">
                    <i class="fas fa-link"></i> 脚本链
                </button>
            </div>
        `;
        fragment.appendChild(card);
    });
    dom.grid.appendChild(fragment);
}

window.handleCopy = function(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
        const oldHtml = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-check"></i> 已复制`;
        btn.classList.add('success');
        setTimeout(() => { btn.innerHTML = oldHtml; btn.classList.remove('success'); }, 1500);
    });
};

function applyFilters() {
    const keyword = dom.searchInput.value.toLowerCase();
    const targetAuthor = dom.authorFilter.value;
    const targetDungeon = dom.dungeonFilter.value;

    const filtered = globalData.presets.filter(item => {
        if (targetAuthor !== 'ALL' && item.a !== targetAuthor) return false;
        if (targetDungeon !== 'ALL' && !(item.t || []).some(id => String(id) === targetDungeon)) return false;
        const searchPool = `${item.n} ${getAuthorName(item.a)}`.toLowerCase();
        return !keyword || searchPool.includes(keyword);
    });
    renderCards(filtered);
}

dom.searchInput.addEventListener('input', applyFilters);
dom.authorFilter.addEventListener('change', applyFilters);
dom.dungeonFilter.addEventListener('change', applyFilters);

initApp();