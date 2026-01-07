// ================= 配置区 =================
const API_URL = 'https://rough-dream-f35a.ottopvpcorp.workers.dev/api/presets';
const MAP_JSON_URL = './territory_names.json';

const AUTHOR_MAPPING = {
    "JiaXX": "JiaXX (贾XX)",
    "Cicero 灵视": "Cicero (灵视)",
    "Tetora": "Tetora (南雲鉄虎)"
};
// =========================================

let globalData = {
    presets: [],
    sources: [], // 存储源地址列表
    maps: {}
};

// DOM 元素引用
const dom = {
    grid: document.getElementById('gridContainer'),
    status: document.getElementById('networkStatus'),
    searchInput: document.getElementById('searchInput'),
    dungeonFilter: document.getElementById('dungeonFilter'),
    authorFilter: document.getElementById('authorFilter'),
    countTotal: document.getElementById('totalCount'),
    countDisplay: document.getElementById('displayCount')
};

// 1. 初始化程序
async function initApp() {
    try {
        dom.status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在拉取数据...';
        
        // 并行加载数据
        const [presetsRes, mapsRes] = await Promise.all([
            fetch(API_URL),
            fetch(MAP_JSON_URL)
        ]);

        if (!presetsRes.ok || !mapsRes.ok) throw new Error("服务器连接失败");

        // 解析新结构
        globalData.presets = data.p; // 预设列表
        globalData.sources = data.s; // 源索引字典
        globalData.maps = await mapsRes.json();

        // 初始化过滤器选项
        initFilters();
        
        // 初次渲染
        renderCards(globalData.presets);
        
        dom.status.innerHTML = '<i class="fas fa-check-circle" style="color:var(--success)"></i> 数据同步完成';
        dom.countTotal.textContent = globalData.presets.length;

    } catch (err) {
        console.error(err);
        dom.status.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:red"></i> 加载失败: ${err.message}`;
        dom.grid.innerHTML = `<div style="text-align:center; padding:50px; color:#666">无法连接到数据服务器，请检查网络或联系管理员。</div>`;
    }
}

// 2. 辅助函数：名称转换
const getAuthorName = (name) => AUTHOR_MAPPING[name] || name;
const getMapName = (id) => globalData.maps[id] || `未知区域 (${id})`;

// 3. 初始化筛选器 (动态生成下拉菜单)
function initFilters() {
    // A. 提取所有作者并去重
    const authors = new Set(globalData.presets.map(p => p.Author));
    Array.from(authors).sort().forEach(auth => {
        const option = new Option(getAuthorName(auth), auth);
        dom.authorFilter.add(option);
    });

    // B. 提取所有副本ID并去重
    const territoryIds = new Set();
    globalData.presets.forEach(p => {
        if (p.TerritoryIds && Array.isArray(p.TerritoryIds)) {
            p.TerritoryIds.forEach(id => territoryIds.add(id));
        }
    });
    
    // 将ID转为名称对象数组，方便排序
    const mapOptions = Array.from(territoryIds).map(id => ({
        id: id,
        name: getMapName(id)
    })).sort((a, b) => a.name.localeCompare(b.name, 'zh'));

    mapOptions.forEach(mapItem => {
        const option = new Option(mapItem.name, mapItem.id);
        dom.dungeonFilter.add(option);
    });
}

// 4. 核心渲染函数
function renderCards(data) {
    dom.grid.innerHTML = ''; // 清空
    dom.countDisplay.textContent = data.length;

    if (data.length === 0) {
        dom.grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#555;">没有找到匹配的预设 🍃</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // 生成地图标签 HTML
        const mapTags = (item.TerritoryIds || [])
            .map(id => `<span class="tag-map"><i class="fas fa-map-marker-alt"></i> ${getMapName(id)}</span>`)
            .join('');

        // 生成描述文本 (合并 UpdateInfo 和 Note)
        const descText = [item.UpdateInfo, item.Note].filter(Boolean).join('\n') || '暂无描述';

        card.innerHTML = `
            <div class="card-body">
                <div class="card-header">
                    <div class="preset-title">${item.Name}</div>
                    <div class="version-tag">v${item.Version}</div>
                </div>
                
                <div class="author-info">
                    <i class="fas fa-user-edit"></i> ${getAuthorName(item.Author)}
                </div>

                <div class="tags-container">
                    ${mapTags}
                </div>

                <div class="desc-box">${descText}</div>
            </div>
            
            <div class="card-footer" style="display: flex; gap: 8px;">
                <button class="btn-copy" style="flex: 1;" onclick="handleCopy(this, '${repoUrl}')">
                    <i class="fas fa-archive"></i> 复制在线库
                </button>
                <button class="btn-copy" style="flex: 1; background: var(--secondary-btn-color, #6e8efb);" onclick="handleCopy(this, '${item.DownloadUrl}')">
                    <i class="fas fa-file-code"></i> 复制脚本链
                </button>
            </div>
        `;
        fragment.appendChild(card);
    });

    dom.grid.appendChild(fragment);
}

// 5. 复制功能
window.handleCopy = function(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-check"></i> 已复制`;
        btn.classList.add('success');
        
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.classList.remove('success');
        }, 2000);
    });
};

// 6. 统一筛选逻辑
function applyFilters() {
    const keyword = dom.searchInput.value.toLowerCase();
    const targetAuthor = dom.authorFilter.value;
    const targetDungeon = dom.dungeonFilter.value; // 这里拿到的是ID字符串或'ALL'

    const filtered = globalData.presets.filter(item => {
        // A. 作者匹配
        if (targetAuthor !== 'ALL' && item.Author !== targetAuthor) return false;

        // B. 副本匹配 (数组包含逻辑)
        // 如果选了特定副本，检查该预设的IDs数组里是否包含这个副本ID
        if (targetDungeon !== 'ALL') {
            const ids = item.TerritoryIds || [];
            // 注意：API返回的ID可能是数字，select value是字符串，要做类型转换对比
            if (!ids.some(id => String(id) === targetDungeon)) return false;
        }

        // C. 关键词搜索
        // 搜索范围：预设名、作者名、副本名
        const mapNames = (item.TerritoryIds || []).map(id => getMapName(id)).join(' ');
        const searchPool = `${item.Name} ${getAuthorName(item.Author)} ${mapNames}`.toLowerCase();
        
        if (keyword && !searchPool.includes(keyword)) return false;

        return true;
    });

    renderCards(filtered);
}

// 绑定事件
dom.searchInput.addEventListener('input', applyFilters);
dom.authorFilter.addEventListener('change', applyFilters);
dom.dungeonFilter.addEventListener('change', applyFilters);

// 启动
initApp();