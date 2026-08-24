/* ============================================
   HOLGENVY - Website Interactions
   ============================================ */

// === COMPONENT LOADER ===
async function loadComponent(url, targetId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        const html = await response.text();
        const target = document.getElementById(targetId);
        if (target) {
            target.innerHTML = html;
        }
    } catch (error) {
        console.error('Component load error:', error);
    }
}

async function loadAllComponents() {
    await Promise.all([
        loadComponent('components/header.html', 'site-header'),
        loadComponent('components/nav.html', 'site-nav'),
        loadComponent('components/footer.html', 'site-footer')
    ]);
    // Re-initialize interactions after components are loaded
    initInteractions();
}

// === INQUIRY LIST SYSTEM (localStorage) ===
const INQUIRY_STORAGE_KEY = 'holgenvy_inquiry_list';

function getInquiryList() {
    try {
        return JSON.parse(localStorage.getItem(INQUIRY_STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveInquiryList(list) {
    localStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify(list));
}

function updateInquiryBadge() {
    const list = getInquiryList();
    const count = list.length;
    // Update all badges (header may have multiple)
    document.querySelectorAll('.cart-badge, #inquiryBadge').forEach(badge => {
        badge.textContent = count;
        if (count > 0) {
            badge.style.display = '';
            badge.style.transform = 'scale(1.3)';
            setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
        } else {
            badge.style.display = '';
        }
    });
}

function addToInquiryList(product) {
    const list = getInquiryList();
    // Avoid duplicates by folder
    if (list.some(item => item.folder === product.folder)) {
        return false; // already in list
    }
    list.push(product);
    saveInquiryList(list);
    updateInquiryBadge();
    return true;
}

function removeFromInquiryList(folder) {
    let list = getInquiryList();
    list = list.filter(item => item.folder !== folder);
    saveInquiryList(list);
    updateInquiryBadge();
}

function clearInquiryList() {
    saveInquiryList([]);
    updateInquiryBadge();
}

// === API BASE URL ===
function getApiBase() {
    // 如果页面从后端服务访问（同源），使用相对路径；否则使用完整后端地址
    const port = window.location.port;
    if (port === '3001' || port === '9090') {
        return '/api';
    }
    // 检查是否在 Vultr 服务器上（80端口）
    if (window.location.hostname === '96.30.206.72' || window.location.hostname === 'holgenvy.com' || window.location.hostname === 'www.holgenvy.com') {
        return '/api';
    }
    return 'http://localhost:3001/api';
}

// === INTERACTIONS INITIALIZER ===
function initInteractions() {

    // === HERO SIDEBAR CATEGORY SWITCH ===
    const sidebarCatLinks = document.querySelectorAll('.sidebar-cat-link');
    const heroPanels = document.querySelectorAll('.hero-slide[data-hero-panel]');

    if (sidebarCatLinks.length && heroPanels.length) {
        // Pause all videos except the active one on load
        heroPanels.forEach(panel => {
            const video = panel.querySelector('video');
            if (video && !panel.classList.contains('active')) {
                video.pause();
            }
        });

        sidebarCatLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const cat = link.getAttribute('data-hero-cat');

                // Update active sidebar link
                sidebarCatLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Pause outgoing panel's video
                heroPanels.forEach(panel => {
                    if (!panel.classList.contains('active')) {
                        const v = panel.querySelector('video');
                        if (v) v.pause();
                    }
                });

                // Switch hero panel
                heroPanels.forEach(panel => {
                    if (panel.getAttribute('data-hero-panel') === cat) {
                        panel.classList.add('active');
                        panel.style.opacity = '0';
                        requestAnimationFrame(() => {
                            panel.style.transition = 'opacity 0.5s ease';
                            panel.style.opacity = '1';
                        });

                        // Play incoming panel's video
                        const v = panel.querySelector('video');
                        if (v) {
                            v.currentTime = 0;
                            v.play().catch(() => {});
                        }
                    } else {
                        panel.classList.remove('active');
                        panel.style.opacity = '0';
                    }
                });
            });
        });
    }

    // === MOBILE MENU TOGGLE ===
    const mobileToggle = document.getElementById('mobileToggle');
    const catNav = document.getElementById('catNav');

    if (mobileToggle && catNav) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileToggle.classList.toggle('active');
            catNav.classList.toggle('active');
        });

        // Close nav when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileToggle.contains(e.target) && !catNav.contains(e.target)) {
                mobileToggle.classList.remove('active');
                catNav.classList.remove('active');
            }
        });
    }

    // === PRODUCT TABS TOP (Industry Products) ===
    initHomeTabs('.featured-products-top', 'data-tab-top', 'products.html');

    function initHomeTabs(containerSelector, dataAttr, targetPage) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const tabBtns = container.querySelectorAll('.tab-btn');
        const allCards = Array.from(container.querySelectorAll('.product-card:not(.view-more-card)'));
        const grid = container.querySelector('.product-grid');
        let currentViewMore = null;

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const tab = btn.getAttribute(dataAttr);

                // Remove old View More card
                if (currentViewMore && currentViewMore.parentNode) {
                    currentViewMore.remove();
                    currentViewMore = null;
                }

                // Filter matching cards
                let matching = [];
                if (tab === 'all') {
                    matching = allCards.slice(0, 8);
                } else {
                    matching = allCards.filter(card => card.getAttribute(dataAttr) === tab);
                }

                // Hide all cards first
                allCards.forEach(card => {
                    card.classList.add('hidden');
                    card.style.display = 'none';
                });

                // Show up to 7 matching cards
                const showCards = matching.slice(0, 7);
                showCards.forEach((card, index) => {
                    card.classList.remove('hidden');
                    card.style.display = '';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(12px)';
                    setTimeout(() => {
                        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 50);
                });

                // Add View More if more than 7
                if (matching.length > 7 || (tab === 'all' && allCards.length > 7)) {
                    const totalInCategory = tab === 'all' ? allCards.length : matching.length;
                    const viewMore = document.createElement('div');
                    viewMore.className = 'product-card view-more-card';
                    viewMore.setAttribute(dataAttr, tab);
                    viewMore.innerHTML = `
                        <div class="product-img">
                            <a class="view-more-link" href="${targetPage}?category=${tab}">
                                <div class="view-more-content">
                                    <svg fill="none" height="32" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="32"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    <span>View All</span>
                                    <small>${totalInCategory} products</small>
                                </div>
                            </a>
                        </div>
                        <div class="product-details">
                            <span class="p-cat">${tab === 'all' ? 'All' : btn.textContent}</span>
                            <h4>View More Products</h4>
                        </div>
                    `;
                    grid.appendChild(viewMore);
                    currentViewMore = viewMore;

                    viewMore.style.opacity = '0';
                    viewMore.style.transform = 'translateY(12px)';
                    setTimeout(() => {
                        viewMore.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        viewMore.style.opacity = '1';
                        viewMore.style.transform = 'translateY(0)';
                    }, showCards.length * 50);
                }
            });
        });

        // Trigger initial tab (All)
        const allBtn = container.querySelector('.tab-btn[data-tab="all"], .tab-btn[data-tab-top="all"]');
        if (allBtn) allBtn.click();
    }

    // === NEWSLETTER FORM ===
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = newsletterForm.querySelector('input');
            const btn = newsletterForm.querySelector('button');

            if (!input.value.trim()) return;

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value.trim())) {
                input.style.borderColor = '#FF4444';
                setTimeout(() => { input.style.borderColor = ''; }, 2000);
                return;
            }

            btn.innerHTML = '<span>Subscribed!</span>';
            btn.style.background = 'linear-gradient(135deg, #B3000E, #E60012, #FF3344)';
            input.value = '';

            setTimeout(() => {
                btn.innerHTML = '<span>Subscribe</span>';
                btn.style.background = '';
            }, 3000);
        });
    }

    // === HERO DOTS ===
    const dots = document.querySelectorAll('.hero-dots .dot');
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
    });

    // === SMOOTH SCROLL ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;
                window.scrollTo({
                    top: target.offsetTop - headerHeight - 20,
                    behavior: 'smooth'
                });
            }
        });
    });

    // === SCROLL REVEAL ANIMATION ===
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    // Apply reveal to major sections
    const revealSections = document.querySelectorAll(
        '.shop-cats, .features-bar, ' +
        '.featured-products-top, ' +
        '.service-icons, .recent-collections, .newsletter'
    );

    revealSections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        revealObserver.observe(section);
    });

    // === PRODUCT CARD HOVER GLOW ===
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'var(--neon)';
        });
        card.addEventListener('mouseleave', () => {
            if (!card.classList.contains('hidden')) {
                card.style.borderColor = '';
            }
        });
    });

    // === SEARCH BAR ===
    const searchInput = document.querySelector('#searchInput');
    const searchBtn = document.querySelector('#searchBtn');
    const searchResults = document.querySelector('#searchResults');
    const searchBar = document.querySelector('#searchBar');
    let searchTimeout = null;

    // 前端本地搜索：缓存产品数据
    let cachedProducts = null;

    async function loadProducts() {
        if (cachedProducts) return cachedProducts;
        try {
            const resp = await fetch('products.json');
            cachedProducts = await resp.json();
        } catch (e) {
            console.error('Failed to load products.json:', e);
            cachedProducts = [];
        }
        return cachedProducts;
    }

    async function performSearch(query) {
        if (!query || query.trim().length === 0) {
            if (searchResults) searchResults.classList.remove('active');
            return;
        }

        // 显示加载状态
        if (searchResults) {
            searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
            searchResults.classList.add('active');
        }

        try {
            const products = await loadProducts();
            const q = query.trim().toLowerCase();
            const matched = products.filter(p => {
                const name = (p.name || '').toLowerCase();
                const cat = (p.category || '').toLowerCase();
                const desc = (p.description || '').toLowerCase();
                return name.includes(q) || cat.includes(q) || desc.includes(q);
            }).slice(0, 8);

            if (searchResults) {
                if (matched.length === 0) {
                    searchResults.innerHTML = '<div class="search-no-result">No products found for "' + query.trim() + '"</div>';
                    return;
                }

                let html = '';
                matched.forEach(item => {
                    const imgSrc = (item.images && item.images[0])
                        ? item.images[0]
                        : '';
                    const imgHtml = imgSrc
                        ? `<img class="search-result-img" src="${imgSrc}" alt="${item.name}" onerror="this.style.display='none'">`
                        : `<div class="search-result-img" style="display:flex;align-items:center;justify-content:center;color:var(--text-light-muted);font-size:0.7rem;">N/A</div>`;
                    const categoryName = item.category || 'Uncategorized';

                    html += `
                        <a class="search-result-item" href="product-detail.html?folder=${encodeURIComponent(item.folder)}">
                            ${imgHtml}
                            <div class="search-result-info">
                                <div class="search-result-name">${item.name}</div>
                                <div class="search-result-category">${categoryName}</div>
                            </div>
                        </a>`;
                });

                // 如果有更多结果，显示 "View All" 链接
                const totalMatched = products.filter(p => {
                    const name = (p.name || '').toLowerCase();
                    const cat = (p.category || '').toLowerCase();
                    const desc = (p.description || '').toLowerCase();
                    return name.includes(q) || cat.includes(q) || desc.includes(q);
                }).length;
                if (totalMatched > matched.length) {
                    html += `<a class="search-view-all" href="products.html?search=${encodeURIComponent(query.trim())}">View All ${totalMatched} Results →</a>`;
                }

                searchResults.innerHTML = html;
            }
        } catch (error) {
            console.error('Search error:', error);
            if (searchResults) {
                searchResults.innerHTML = '<div class="search-no-result">Search temporarily unavailable</div>';
            }
        }
    }

    function closeSearchResults() {
        if (searchResults) searchResults.classList.remove('active');
    }

    if (searchInput && searchBtn && searchResults) {
        // Focus effect
        searchInput.addEventListener('focus', () => {
            if (searchBar) searchBar.classList.add('focused');
            // 如果输入框有内容，聚焦时重新显示结果
            if (searchInput.value.trim().length > 0) {
                performSearch(searchInput.value);
            }
        });

        searchInput.addEventListener('blur', () => {
            if (searchBar) searchBar.classList.remove('focused');
            // 延迟关闭，允许点击结果链接
            setTimeout(closeSearchResults, 200);
        });

        // Enter key search
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(searchInput.value);
            }
            if (e.key === 'Escape') {
                closeSearchResults();
                searchInput.blur();
            }
        });

        // Search button click
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch(searchInput.value);
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (searchBar && !searchBar.contains(e.target)) {
                closeSearchResults();
            }
        });
    }

    // Initialize badge on page load
    updateInquiryBadge();

    // === ADD TO INQUIRY BUTTONS ===
    // Support both deal-card buttons and product-detail page buttons
    const inquiryBtns = document.querySelectorAll('.deal-card .btn-neon, .btn-add-inquiry');
    inquiryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            // Try to get product info from parent card
            const card = btn.closest('.deal-card, .product-card, .product-page-card, .product-hero-layout');
            let product = { folder: '', name: 'Unknown Product', image: '', category: '' };

            if (card) {
                const link = card.querySelector('a[href*="product-detail.html"]');
                if (link) {
                    const href = link.getAttribute('href');
                    const match = href.match(/folder=([^&]+)/);
                    if (match) product.folder = decodeURIComponent(match[1]);
                }
                const nameEl = card.querySelector('h3, h4, .product-name, .p-name');
                if (nameEl) product.name = nameEl.textContent.trim();
                const imgEl = card.querySelector('img');
                if (imgEl) product.image = imgEl.getAttribute('src') || '';
                const catEl = card.querySelector('.p-cat, .product-category');
                if (catEl) product.category = catEl.textContent.trim();
            }

            // Fallback: check data attributes on button
            if (!product.folder && btn.dataset.folder) {
                product.folder = btn.dataset.folder;
            }
            if (product.name === 'Unknown Product' && btn.dataset.name) {
                product.name = btn.dataset.name;
            }
            if (!product.image && btn.dataset.image) {
                product.image = btn.dataset.image;
            }

            const added = addToInquiryList(product);
            const originalText = btn.innerHTML;

            if (added) {
                btn.innerHTML = '<span>Added to List!</span>';
                btn.style.background = 'linear-gradient(135deg, #B3000E, #E60012, #FF3344)';
            } else {
                btn.innerHTML = '<span>Already in List</span>';
                btn.style.background = '#F59E0B';
            }

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 1500);
        });
    });

    // === HEADER SHADOW ON SCROLL ===
    const mainHeader = document.getElementById('mainHeader');
    if (mainHeader) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 10) {
                mainHeader.style.boxShadow = '0 4px 30px rgba(0,0,0,0.6)';
            } else {
                mainHeader.style.boxShadow = 'none';
            }
        });
    }

    // === PROGRESS BAR ANIMATION ===
    const progressBars = document.querySelectorAll('.progress-fill');
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const width = entry.target.style.width;
                entry.target.style.width = '0%';
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        entry.target.style.transition = 'width 1.2s ease';
                        entry.target.style.width = width;
                    }, 200);
                });
                progressObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    progressBars.forEach(bar => progressObserver.observe(bar));

    // === PRODUCT PAGE FILTER ===
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    const powerBtns = document.querySelectorAll('.power-btn[data-power]');
    const productPageCards = document.querySelectorAll('.product-page-card');
    const productCount = document.querySelector('.product-count strong');

    let currentCategory = 'all';
    let currentPower = 'all';

    function applyFilters() {
        let visible = 0;
        productPageCards.forEach(card => {
            const cat = card.getAttribute('data-category');
            const powerType = card.getAttribute('data-power-type') || '';

            const matchCategory = currentCategory === 'all' || cat === currentCategory;
            const matchPower = currentPower === 'all' ||
                powerType.split(',').some(t => t.trim() === currentPower);

            if (matchCategory && matchPower) {
                card.classList.remove('filter-hidden');
                card.classList.remove('hidden');
                visible++;
            } else {
                card.classList.add('filter-hidden');
            }
        });

        if (productCount) {
            productCount.textContent = visible;
        }
    }

    if (filterBtns.length && productPageCards.length) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = btn.getAttribute('data-filter');
                applyFilters();
            });
        });
    }

    if (powerBtns.length && productPageCards.length) {
        powerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                powerBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPower = btn.getAttribute('data-power');
                applyFilters();
            });
        });
    }

    // === PRODUCT PAGE PAGINATION ===
    initPagination();

    // === URL PARAMETER AUTO FILTER ===
    initUrlFilter();

    // === SHOP BY CATEGORY SCROLL SIZING ===
    initCatScroll();

    // === PRODUCT CARD CAROUSELS ===
    initCarousels();
}

// === SHOP BY CATEGORY SCROLL SIZING ===
function initCatScroll() {
    const wrapper = document.querySelector('.cats-scroll-wrapper');
    const track = document.querySelector('.cats-scroll-track');
    if (!wrapper || !track) return;

    function resize() {
        const wrapperW = wrapper.clientWidth;
        const gap = 20;
        const cols = window.innerWidth <= 480 ? 2 : window.innerWidth <= 992 ? 3 : 6;
        const itemW = (wrapperW - gap * (cols - 1)) / cols;
        track.querySelectorAll('.cat-item').forEach(item => {
            item.style.flex = '0 0 ' + itemW + 'px';
            item.style.maxWidth = itemW + 'px';
        });
    }

    resize();
    window.addEventListener('resize', resize);
}

// === URL PARAMETER AUTO FILTER ===
function initUrlFilter() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    if (!category) return;

    // Find matching filter button and click it
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    filterBtns.forEach(btn => {
        if (btn.getAttribute('data-filter') === category) {
            btn.click();
        }
    });
}

// === PRODUCT PAGE PAGINATION ===
function initPagination() {
    const productsGrid = document.getElementById('productsGrid');
    const paginationContainer = document.querySelector('.pagination');
    if (!productsGrid || !paginationContainer) return;

    const ITEMS_PER_PAGE = 12;
    const MAX_VISIBLE_PAGES = 5;
    let currentPage = 1;

    function getVisibleCards() {
        return Array.from(productsGrid.querySelectorAll('.product-page-card'));
    }

    function renderPagination() {
        const allCards = getVisibleCards();
        // Only paginate cards that pass filter
        const filteredCards = allCards.filter(c => !c.classList.contains('filter-hidden'));
        const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);

        // First remove all pagination hidden states
        allCards.forEach(card => card.classList.remove('hidden'));

        // Hide all filtered cards, then show current page
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        filteredCards.forEach(card => card.classList.add('hidden'));
        filteredCards.slice(start, end).forEach(card => card.classList.remove('hidden'));

        // Re-generate pagination HTML
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        paginationContainer.style.display = 'flex';

        let html = '';

        // Prev button
        if (currentPage > 1) {
            html += `<a class="page-btn prev" href="#" data-page="prev"><svg fill="none" height="14" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14"><polyline points="15 18 9 12 15 6"></polyline></svg> Prev</a>`;
        }

        // Page numbers with ellipsis
        let pageStart = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
        let pageEnd = Math.min(totalPages, pageStart + MAX_VISIBLE_PAGES - 1);
        if (pageEnd - pageStart + 1 < MAX_VISIBLE_PAGES) {
            pageStart = Math.max(1, pageEnd - MAX_VISIBLE_PAGES + 1);
        }

        if (pageStart > 1) {
            html += `<a class="page-btn" href="#" data-page="1">1</a>`;
            if (pageStart > 2) {
                html += `<span class="page-dots">...</span>`;
            }
        }

        for (let i = pageStart; i <= pageEnd; i++) {
            if (i === currentPage) {
                html += `<a class="page-btn active" href="#" data-page="${i}">${i}</a>`;
            } else {
                html += `<a class="page-btn" href="#" data-page="${i}">${i}</a>`;
            }
        }

        if (pageEnd < totalPages) {
            if (pageEnd < totalPages - 1) {
                html += `<span class="page-dots">...</span>`;
            }
            html += `<a class="page-btn" href="#" data-page="${totalPages}">${totalPages}</a>`;
        }

        // Next button
        if (currentPage < totalPages) {
            html += `<a class="page-btn next" href="#" data-page="next">Next <svg fill="none" height="14" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14"><polyline points="9 18 15 12 9 6"></polyline></svg></a>`;
        }

        paginationContainer.innerHTML = html;

        // Re-attach click handlers
        paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = btn.getAttribute('data-page');
                const allCards = Array.from(productsGrid.querySelectorAll('.product-page-card')).filter(c => !c.classList.contains('filter-hidden'));
                const total = Math.ceil(allCards.length / ITEMS_PER_PAGE);

                if (page === 'next') {
                    if (currentPage < total) currentPage++;
                } else if (page === 'prev') {
                    if (currentPage > 1) currentPage--;
                } else {
                    currentPage = parseInt(page, 10);
                }

                renderPagination();
                productsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    // Initial render
    renderPagination();

    // Re-render when filter changes
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = 1;
            // Wait for filter logic to update visibility
            setTimeout(renderPagination, 50);
        });
    });
}

// === PRODUCT CARD CAROUSELS ===
function initCarousels() {
    const carousels = document.querySelectorAll('.product-carousel');

    carousels.forEach(carousel => {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const dots = carousel.querySelectorAll('.carousel-dots .dot');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        const autoplay = carousel.getAttribute('data-autoplay') === 'true';
        const interval = parseInt(carousel.getAttribute('data-interval')) || 4000;

        if (slides.length <= 1) return;

        let currentIndex = 0;
        let timer = null;

        function goToSlide(index) {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;

            slides[currentIndex].classList.remove('active');
            if (dots[currentIndex]) dots[currentIndex].classList.remove('active');

            currentIndex = index;

            slides[currentIndex].classList.add('active');
            if (dots[currentIndex]) dots[currentIndex].classList.add('active');
        }

        function next() { goToSlide(currentIndex + 1); }
        function prev() { goToSlide(currentIndex - 1); }

        function startAutoplay() {
            if (autoplay) {
                timer = setInterval(next, interval);
            }
        }

        function stopAutoplay() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

        // Events
        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });

        dots.forEach((dot, i) => {
            dot.addEventListener('click', (e) => { e.stopPropagation(); goToSlide(i); });
        });

        // Pause on hover
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);

        // Start
        startAutoplay();
    });
}

// === INQUIRY LIST PAGE RENDERER ===
function initInquiryListPage() {
    const listContainer = document.getElementById('inquiryListItems');
    const emptyState = document.getElementById('inquiryListEmpty');
    const contentState = document.getElementById('inquiryListContent');
    const itemCountEl = document.getElementById('inquiryItemCount');
    const clearAllBtn = document.getElementById('clearAllBtn');

    if (!listContainer) return; // Not on inquiry-list page

    function renderList() {
        const list = getInquiryList();

        if (list.length === 0) {
            emptyState.style.display = '';
            contentState.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        contentState.style.display = '';
        if (itemCountEl) itemCountEl.textContent = list.length;

        let html = '';
        list.forEach((item, index) => {
            const imgSrc = item.image
                ? (item.image.startsWith('http') ? item.image : item.image)
                : '';
            const imgHtml = imgSrc
                ? `<img src="${imgSrc}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="inq-item-img-placeholder" style="display:none;">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                   </div>`
                : `<div class="inq-item-img-placeholder">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                   </div>`;

            html += `
                <div class="inq-list-item" data-folder="${item.folder}">
                    <div class="inq-item-img">${imgHtml}</div>
                    <div class="inq-item-details">
                        <span class="inq-item-cat">${item.category || 'General'}</span>
                        <h4 class="inq-item-name">${item.name}</h4>
                        <a href="product-detail.html?folder=${encodeURIComponent(item.folder)}" class="inq-item-link">View Details →</a>
                    </div>
                    <div class="inq-item-actions">
                        <button class="btn-remove-item" data-folder="${item.folder}" title="Remove">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                </div>`;
        });

        listContainer.innerHTML = html;

        // Attach remove handlers
        listContainer.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const folder = btn.getAttribute('data-folder');
                const itemEl = btn.closest('.inq-list-item');
                itemEl.style.opacity = '0';
                itemEl.style.transform = 'translateX(30px)';
                setTimeout(() => {
                    removeFromInquiryList(folder);
                    renderList();
                }, 300);
            });
        });
    }

    // Clear all button
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all items from your inquiry list?')) {
                clearInquiryList();
                renderList();
            }
        });
    }

    renderList();
}

// === SUBMIT INQUIRY TO BACKEND ===
async function submitInquiryToBackend(formData, source) {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/inquiries/public/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source: source || 'website' })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.error || '提交失败');
    }
    return data;
}

// === INQUIRY PAGE FORM LOGIC ===
function initInquiryPage() {
    const form = document.getElementById('inquiryPageForm');
    const productField = document.getElementById('inquiryProductField');

    if (!form) return; // Not on inquiry page

    // Auto-fill product field from inquiry list
    if (productField) {
        const list = getInquiryList();
        if (list.length > 0) {
            const names = list.map(item => item.name).filter(n => n && n !== 'Unknown Product');
            productField.value = names.join(', ');
            productField.removeAttribute('readonly');
        } else {
            productField.removeAttribute('readonly');
            productField.value = '';
        }
    }

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.disabled = true;

        try {
            const formData = {
                name: form.querySelector('[name="name"]').value,
                company: form.querySelector('[name="company"]').value,
                email: form.querySelector('[name="email"]').value,
                phone: form.querySelector('[name="phone"]').value,
                subject: form.querySelector('[name="subject"]').value,
                products: productField ? productField.value : '',
                quantity: form.querySelector('[name="quantity"]').value,
                message: form.querySelector('[name="message"]').value
            };

            await submitInquiryToBackend(formData, 'inquiry-page');

            submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Inquiry Sent!';
            submitBtn.style.background = 'linear-gradient(135deg, #B3000E, #E60012, #FF3344)';

            // Clear inquiry list after successful submission
            clearInquiryList();

            setTimeout(() => {
                submitBtn.innerHTML = originalHTML;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
                form.reset();
                if (productField) productField.value = '';
            }, 3000);
        } catch (error) {
            submitBtn.innerHTML = originalHTML;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
            alert('提交失败: ' + error.message);
        }
    });
}

// === CONTACT PAGE FORM LOGIC ===
function initContactForm() {
    const form = document.getElementById('inquiryForm');
    if (!form) return; // Not on contact page

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.disabled = true;

        try {
            const formData = {
                name: form.querySelector('input[type="text"]').value,
                company: form.querySelectorAll('input[type="text"]')[1] ? form.querySelectorAll('input[type="text"]')[1].value : '',
                email: form.querySelector('input[type="email"]').value,
                phone: form.querySelector('input[type="tel"]').value,
                subject: form.querySelector('select').value,
                products: form.querySelector('input[placeholder*="e.g."]').value,
                message: form.querySelector('textarea').value
            };

            await submitInquiryToBackend(formData, 'contact-page');

            submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Inquiry Sent!';
            submitBtn.style.background = 'linear-gradient(135deg, #B3000E, #E60012, #FF3344)';

            setTimeout(() => {
                submitBtn.innerHTML = originalHTML;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
                form.reset();
            }, 3000);
        } catch (error) {
            submitBtn.innerHTML = originalHTML;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
            alert('提交失败: ' + error.message);
        }
    });
}

// === FAQ ACCORDION ===
function initFaqAccordion() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach(btn => {
        btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            const answer = btn.nextElementSibling;

            // Close all others
            questions.forEach(q => {
                q.setAttribute('aria-expanded', 'false');
                q.nextElementSibling.classList.remove('open');
            });

            if (!expanded) {
                btn.setAttribute('aria-expanded', 'true');
                answer.classList.add('open');
            }
        });
    });
}

// === BLOG PAGE LOGIC ===
const BLOG_CATEGORIES = {
    'industry-trends': 'Industry Trends',
    'sourcing-guide': 'Sourcing Guide',
    'product-spotlight': 'Product Spotlight',
    'technical': 'Technical',
    'product-guide': 'Product Guide'
};

let blogCurrentPage = 1;
let blogCurrentCategory = '';
const blogPageSize = 9;

function initBlogPage() {
    const blogGrid = document.getElementById('blogGrid');
    if (!blogGrid) return; // Not on blog page

    // Bind filter buttons
    const filterBtns = document.querySelectorAll('.blog-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            blogCurrentCategory = btn.dataset.category;
            blogCurrentPage = 1;
            loadBlogPosts();
        });
    });

    loadBlogPosts();
}

async function loadBlogPosts() {
    const blogGrid = document.getElementById('blogGrid');
    const blogPagination = document.getElementById('blogPagination');
    if (!blogGrid) return;

    // Show loading
    blogGrid.innerHTML = '<div class="blog-loading"><div class="spinner"></div><p>Loading articles...</p></div>';
    blogPagination.innerHTML = '';

    try {
        const apiBase = getApiBase();
        let url = `${apiBase}/posts?status=1&page=${blogCurrentPage}&limit=${blogPageSize}`;
        if (blogCurrentCategory) url += `&category=${blogCurrentCategory}`;

        const response = await fetch(url);
        const result = await response.json();

        if (!result.success || !result.data || !result.data.posts) {
            throw new Error('Invalid API response');
        }

        const { posts, pagination } = result.data;

        if (posts.length === 0) {
            blogGrid.innerHTML = `
                <div class="blog-empty" style="grid-column: 1 / -1;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <h3>No articles found</h3>
                    <p>Check back later for new content.</p>
                </div>`;
            return;
        }

        // Render blog cards
        blogGrid.innerHTML = posts.map(post => {
            const slug = post.slug || post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            const categoryLabel = BLOG_CATEGORIES[post.category] || post.category || 'Uncategorized';
            const dateStr = formatDateShort(post.published_at || post.created_at);
            const summary = post.summary || '';
            const authorInitial = (post.author || 'H').charAt(0).toUpperCase();
            const readTime = post.read_time || '5 min';
            const coverImage = post.cover_image
                ? `<img src="${post.cover_image}" alt="${escapeHtml(post.title)}" loading="lazy">`
                : `<div class="img-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>Article Image</span></div>`;

            return `
                <a href="blog-post-${escapeHtml(slug)}.html" class="blog-card">
                    <div class="blog-img">${coverImage}</div>
                    <div class="blog-info">
                        <div class="blog-meta-top">
                            <span class="blog-tag">${escapeHtml(categoryLabel)}</span>
                            <span class="blog-date">${escapeHtml(dateStr)}</span>
                        </div>
                        <h4>${escapeHtml(post.title)}</h4>
                        <p>${escapeHtml(summary.length > 120 ? summary.substring(0, 120) + '...' : summary)}</p>
                        <div class="blog-card-author">
                            <span class="author-avatar">${authorInitial}</span>
                            <span>${escapeHtml(post.author || 'HOLGENVY')} · ${readTime} read</span>
                        </div>
                    </div>
                </a>`;
        }).join('');

        // Render pagination
        renderBlogPagination(pagination);

    } catch (error) {
        console.error('Failed to load blog posts:', error);
        blogGrid.innerHTML = `
            <div class="blog-empty" style="grid-column: 1 / -1;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>Unable to load articles</h3>
                <p>Please try again later.</p>
            </div>`;
    }
}

function renderBlogPagination(pagination) {
    const container = document.getElementById('blogPagination');
    if (!container || pagination.totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `<button ${pagination.page <= 1 ? 'disabled' : ''} onclick="goBlogPage(${pagination.page - 1})">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    </button>`;

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<button onclick="goBlogPage(1)">1</button>`;
        if (startPage > 2) html += `<button disabled>...</button>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === pagination.page ? 'active' : ''}" onclick="goBlogPage(${i})">${i}</button>`;
    }

    if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) html += `<button disabled>...</button>`;
        html += `<button onclick="goBlogPage(${pagination.totalPages})">${pagination.totalPages}</button>`;
    }

    // Next button
    html += `<button ${pagination.page >= pagination.totalPages ? 'disabled' : ''} onclick="goBlogPage(${pagination.page + 1})">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;

    container.innerHTML = html;
}

function goBlogPage(page) {
    blogCurrentPage = page;
    loadBlogPosts();
    window.scrollTo({ top: document.getElementById('blogGrid').offsetTop - 100, behavior: 'smooth' });
}

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// === INITIALIZE ===
document.addEventListener('DOMContentLoaded', () => {
    loadAllComponents().then(() => {
        initBlogPage();
        initInquiryListPage();
        initInquiryPage();
        initContactForm();
        initFaqAccordion();
    });
});
