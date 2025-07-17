/**
 * 章丘传统村落地图交互功能
 * 此脚本提供示范区概览页面的交互式地图功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化地图
    const map = L.map('map-container').setView([36.7138, 117.5228], 11); // 章丘区中心位置
    
    // 添加底图
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // 章丘传统村落数据
    const villages = [
        {
            name: "三德范村",
            location: [36.7450, 117.4983],
            address: "山东省章丘区文祖街道 三德范村",
            level: "national", // 国家级
            area: "central",  // 区域位置
            features: ["明清古建筑群", "传统民俗活动", "木工技艺"],
            image: "images/sandefan.jpg"
        },
        {
            name: "石子口村",
            location: [36.7582, 117.5123],
            address: "山东省章丘区文祖街道 石子口村",
            level: "province", // 省级
            area: "north",
            features: ["传统民居", "历史文化遗迹", "民间工艺"],
            image: "images/shizikou.jpg"
        },
        {
            name: "青野村",
            location: [36.7321, 117.4876],
            address: "山东省章丘区文祖街道 青野村",
            level: "local", // 区级
            area: "central",
            features: ["农耕文化", "传统农具", "古树名木"],
            image: "images/qingye.jpg"
        },
        {
            name: "朱家裕村",
            location: [36.6985, 117.4567],
            address: "山东省章丘区官庄街道 朱家裕村",
            level: "province",
            area: "west",
            features: ["传统建筑", "民俗文化", "手工艺"],
            image: "images/zhujiayu.jpg"
        },
        {
            name: "东矾硫村",
            location: [36.6789, 117.4721],
            address: "山东省章丘区官庄街道 东矾硫村",
            level: "local",
            area: "west",
            features: ["古村落", "传统纺织", "民间艺术"],
            image: "images/东矾硫村.jpg"
        },
        {
            name: "博平村",
            location: [36.7731, 117.5376],
            address: "山东省章丘区普集街道博平村",
            level: "province",
            area: "north",
            features: ["古建筑群", "传统手工艺", "民俗活动"],
            image: "images/bopingcun.jpg"
        },
        {
            name: "袭家村",
            location: [36.7629, 117.5512],
            address: "山东省章丘区普集街道袭家村",
            level: "local",
            area: "north",
            features: ["传统民居", "乡村文化", "民间故事"],
            image: "images/袭家村.jpg"
        },
        {
            name: "于家村",
            location: [36.7528, 117.5392],
            address: "山东省章丘区普集街道于家村",
            level: "local",
            area: "north",
            features: ["传统建筑", "农耕文化", "手工艺"],
            image: "images/yujia-cun.jpg"
        },
        {
            name: "十九郎村",
            location: [36.6845, 117.5621],
            address: "山东省章丘区相公庄街道十九郎村",
            level: "province",
            area: "south",
            features: ["明清建筑", "传统文化", "民间艺术"],
            image: "images/十九郎村.jpg"
        },
        {
            name: "梭庄村",
            location: [36.6723, 117.5483],
            address: "山东省章丘区相公庄街道梭庄村",
            level: "local",
            area: "south",
            features: ["传统民居", "民俗文化", "历史遗迹"],
            image: "images/梭庄村.jpg"
        },
        {
            name: "吕家村",
            location: [36.7143, 117.5712],
            address: "山东省章丘区明水街道吕家村",
            level: "province",
            area: "east",
            features: ["古建筑", "传统工艺", "历史文化"],
            image: "images/吕家村.jpg"
        },
        {
            name: "白云湖村",
            location: [36.7353, 117.5921],
            address: "山东省章丘区明水街道白云湖村",
            level: "national",
            area: "east",
            features: ["传统民居", "民俗活动", "口述历史"],
            image: "images/白云湖村.jpg"
        }
    ];
    
    // 定义不同等级村落的图标
    const nationalIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#c53030; width:15px; height:15px; border-radius:50%; border:2px solid white;"></div>`,
        iconSize: [15, 15],
        iconAnchor: [8, 8]
    });
    
    const provinceIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#3182ce; width:12px; height:12px; border-radius:50%; border:2px solid white;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
    
    const localIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#805ad5; width:10px; height:10px; border-radius:50%; border:2px solid white;"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5]
    });
    
    // 将村落添加到地图
    villages.forEach(village => {
        // 根据等级选择图标
        let icon;
        switch (village.level) {
            case 'national':
                icon = nationalIcon;
                break;
            case 'province':
                icon = provinceIcon;
                break;
            default:
                icon = localIcon;
                break;
        }
        
        // 创建标记并添加到地图
        const marker = L.marker(village.location, {icon: icon}).addTo(map);
        
        // 创建弹出窗口
        const popupContent = `
            <div style="width: 200px;">
                <h3 style="color: #c53030; margin: 0 0 5px 0;">${village.name}</h3>
                <p style="color: #666; font-size: 12px; margin: 0 0 5px 0;">${village.address}</p>
                <div style="margin: 5px 0; height: 100px; overflow: hidden; border-radius: 4px;">
                    <img src="${village.image}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <p style="margin: 5px 0 0 0; font-size: 12px;">
                    <strong>特色：</strong>${village.features.join('、')}
                </p>
            </div>
        `;
        marker.bindPopup(popupContent);
        
        // 添加到村落卡片显示区域
        addVillageCard(village);
    });
    
    // 添加村落卡片到页面
    function addVillageCard(village) {
        const villagesGrid = document.getElementById('villages-grid');
        
        const card = document.createElement('div');
        card.className = `village-card ${village.level} ${village.area}`;
        card.setAttribute('data-level', village.level);
        card.setAttribute('data-area', village.area);
        card.setAttribute('data-aos', 'fade-up');
        
        card.innerHTML = `
            <div class="village-card-image">
                <img src="${village.image}" alt="${village.name}">
            </div>
            <div class="village-card-content">
                <h3 class="village-card-title">${village.name}</h3>
                <div class="village-tags">
                    <span class="village-tag">${getLevelName(village.level)}</span>
                    <span class="village-tag">${getAreaName(village.area)}</span>
                </div>
                <p style="margin-bottom: 8px; font-size: 0.9rem; color: #666;">${village.address}</p>
                <div class="village-card-stats">
                    <div class="village-stat">
                        <div class="stat-value">${Math.floor(Math.random() * 15) + 5}</div>
                        <div class="stat-label">古建筑</div>
                    </div>
                    <div class="village-stat">
                        <div class="stat-value">${Math.floor(Math.random() * 8) + 2}</div>
                        <div class="stat-label">非遗项目</div>
                    </div>
                    <div class="village-stat">
                        <div class="stat-value">${Math.floor(Math.random() * 10) + 5}</div>
                        <div class="stat-label">文化活动</div>
                    </div>
                </div>
                <a href="#" class="btn-secondary" style="width: 100%; text-align: center; margin-top: 8px;">查看详情</a>
            </div>
        `;
        
        villagesGrid.appendChild(card);
    }
    
    // 筛选功能
    const filterButtons = document.querySelectorAll('.village-filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 更新选中状态
            filterButtons.forEach(btn => {
                btn.style.backgroundColor = 'white';
                btn.style.color = 'var(--color-text)';
                btn.classList.remove('active');
            });
            this.style.backgroundColor = 'var(--color-primary)';
            this.style.color = 'white';
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            const cards = document.querySelectorAll('.village-card');
            
            cards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else if (filter === 'national' || filter === 'province' || filter === 'local') {
                    // 筛选等级
                    if (card.getAttribute('data-level') === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                } else {
                    // 筛选区域
                    if (card.getAttribute('data-area') === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });
    
    // 等级名称转换
    function getLevelName(level) {
        switch(level) {
            case 'national': return '国家级';
            case 'province': return '省级';
            case 'local': return '区级';
            default: return '';
        }
    }
    
    // 区域名称转换
    function getAreaName(area) {
        switch(area) {
            case 'north': return '北部';
            case 'south': return '南部';
            case 'east': return '东部';
            case 'west': return '西部';
            case 'central': return '中部';
            default: return '';
        }
    }
    
    // 初始化统计图表
    initCharts();
    
    // 统计图表
    function initCharts() {
        // 村落等级分布图表
        const levelCounts = {
            national: villages.filter(v => v.level === 'national').length,
            province: villages.filter(v => v.level === 'province').length,
            local: villages.filter(v => v.level === 'local').length
        };
        
        const levelChart = new Chart(
            document.getElementById('village-stats-chart'),
            {
                type: 'pie',
                data: {
                    labels: ['国家级', '省级', '区级'],
                    datasets: [{
                        data: [levelCounts.national, levelCounts.province, levelCounts.local],
                        backgroundColor: ['#c53030', '#3182ce', '#805ad5'],
                        borderColor: 'white',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            }
        );
        
        // 文化资源统计图表
        const resourcesChart = new Chart(
            document.getElementById('resources-stats-chart'),
            {
                type: 'bar',
                data: {
                    labels: ['物质文化遗产', '非物质文化遗产', '文化活动', '历史人物'],
                    datasets: [{
                        label: '资源数量',
                        data: [195, 12, 28, 45],
                        backgroundColor: ['#c53030', '#3182ce', '#805ad5', '#38a169']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
    }
}); 