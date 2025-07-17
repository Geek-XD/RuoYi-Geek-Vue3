document.addEventListener('DOMContentLoaded', function() {
    // 初始化 AOS 动画库
    AOS.init({
        duration: 800,
        easing: 'ease',
        once: true,
        offset: 100
    });

    // 初始化 Swiper 轮播
    const heroSwiper = new Swiper('.hero-swiper', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true
        },
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        }
    });

    // 导航栏滚动效果
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 移动端菜单切换
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('open');
            document.body.classList.toggle('menu-open');
        });
    }

    // 数字计数动画
    const statNumbers = document.querySelectorAll('.stat-number');
    
    function animateNumber(el, target) {
        let current = 0;
        const increment = target > 100 ? 5 : 1;
        const duration = 2000;
        const steps = Math.ceil(target / increment);
        const stepTime = duration / steps;
        
        const timer = setInterval(() => {
            current += increment;
            if (current > target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = current;
        }, stepTime);
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-count'));
                animateNumber(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(number => {
        observer.observe(number);
    });

    // 苹果风格的视差滚动效果
    const parallaxSections = document.querySelectorAll('.village-showcase, .methodology-section, .team-section');
    
    function appleStyleParallax() {
        parallaxSections.forEach(section => {
            const scrollPosition = window.scrollY;
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const viewportHeight = window.innerHeight;
            
            // 计算该部分在视口中的位置百分比
            if (scrollPosition + viewportHeight > sectionTop && scrollPosition < sectionTop + sectionHeight) {
                const percentageScrolled = (scrollPosition + viewportHeight - sectionTop) / (sectionHeight + viewportHeight);
                
                // 应用视差效果
                const translateY = (percentageScrolled - 0.5) * 60;
                const opacity = Math.min(1, 2 * percentageScrolled);
                
                const images = section.querySelectorAll('img');
                const headings = section.querySelectorAll('h2, h3');
                
                images.forEach(img => {
                    img.style.transform = `translateY(${translateY * 0.5}px)`;
                });
                
                headings.forEach(heading => {
                    heading.style.transform = `translateY(${translateY * 0.3}px)`;
                    heading.style.opacity = opacity.toFixed(2);
                });
            }
        });
    }
    
    // 添加滚动事件监听器，实现苹果风格的视差效果
    window.addEventListener('scroll', function() {
        appleStyleParallax();
    });
    
    // 首次加载时执行一次
    appleStyleParallax();

    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // 减去导航栏高度
                    behavior: 'smooth'
                });
                
                // 如果导航栏是打开的，关闭它
                if (nav.classList.contains('open')) {
                    nav.classList.remove('open');
                    document.body.classList.remove('menu-open');
                }
            }
        });
    });

    // 高级图片加载动画
    const allImages = document.querySelectorAll('img:not(.logo-img)');
    
    allImages.forEach(img => {
        // 如果图片已经加载
        if (img.complete) {
            imgLoaded(img);
        } else {
            // 否则等待加载
            img.addEventListener('load', function() {
                imgLoaded(img);
            });
        }
    });
    
    function imgLoaded(img) {
        // 添加淡入动画类
        img.classList.add('img-loaded');
    }

    // 添加互动悬浮效果到村落概览卡片
    const villageCard = document.querySelector('.village-content');
    if (villageCard) {
        const villageImage = villageCard.querySelector('.village-image');
        const villageInfo = villageCard.querySelector('.village-info');
        
        villageCard.addEventListener('mousemove', (e) => {
            const cardRect = villageCard.getBoundingClientRect();
            const xPos = (e.clientX - cardRect.left) / cardRect.width - 0.5;
            const yPos = (e.clientY - cardRect.top) / cardRect.height - 0.5;
            
            villageImage.style.transform = `perspective(1000px) rotateY(${xPos * 5}deg) rotateX(${yPos * -5}deg)`;
            villageInfo.style.transform = `perspective(1000px) rotateY(${xPos * 2}deg) rotateX(${yPos * -2}deg)`;
        });
        
        villageCard.addEventListener('mouseleave', () => {
            villageImage.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
            villageInfo.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
        });
    }

    // 语言切换功能
    const langSwitchers = document.querySelectorAll('.lang-switch span');
    langSwitchers.forEach(switcher => {
        switcher.addEventListener('click', function() {
            langSwitchers.forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            // 这里可以添加实际的语言切换逻辑
        });
    });
}); 