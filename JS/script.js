document.addEventListener('DOMContentLoaded', function() {
    // ===== МЕНЮ =====
    const burgerMenu = document.getElementById('burgerMenu');
    const navMenu = document.getElementById('navMenu');
    if (burgerMenu && navMenu) {
        burgerMenu.addEventListener('click', function() {
            burgerMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                burgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // ===== КАТАЛОГ =====
    const catalogGrid = document.getElementById('catalogGrid');
    const prevArrow = document.querySelector('.prev-arrow');
    const nextArrow = document.querySelector('.next-arrow');
    let currentIndex = 0;
    if (catalogGrid && prevArrow && nextArrow) {
        const products = Array.from(catalogGrid.children);
        const total = products.length;
        const showProducts = (index) => {
            products.forEach(p => p.style.display = 'none');
            for (let i = 0; i < 2; i++) {
                products[(index + i) % total].style.display = 'flex';
            }
        };
        prevArrow.onclick = () => { currentIndex = (currentIndex - 1 + total) % total; showProducts(currentIndex); };
        nextArrow.onclick = () => { currentIndex = (currentIndex + 1) % total; showProducts(currentIndex); };
        showProducts(0);
    }

    // ===== РЕЙТИНГ =====
    document.querySelectorAll('.rating-input .star').forEach((star, i) => {
        star.onclick = () => {
            star.parentElement.querySelectorAll('.star').forEach((s, idx) => {
                s.classList.toggle('active', idx <= i);
            });
        };
    });

    // ===== SUPABASE =====
    const SUPABASE_URL = 'https://wrvovgkrrguvcvzeoyne.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_oq84G50obqgmOAj60kUPmw_YPrq-DpT';

    // ===== ФОТО =====
    const photoLabel = document.getElementById('photoLabel');
    const photoInput = document.getElementById('photoInput');
    const photoPreviews = document.getElementById('photoPreviews');
    const photoCount = document.getElementById('photoCount');
    let selectedFiles = [];
    const MAX_PHOTOS = 3;

    if (photoLabel && photoInput) {
        photoLabel.onclick = (e) => { e.preventDefault(); photoInput.click(); };
        photoInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (selectedFiles.length + files.length > MAX_PHOTOS) {
                alert(`Можно загрузить не более ${MAX_PHOTOS} фото`);
                photoInput.value = '';
                return;
            }
            files.forEach(file => {
                if (file.size > 5 * 1024 * 1024) return alert(`Файл ${file.name} слишком большой (макс. 5MB)`);
                if (!file.type.startsWith('image/')) return alert(`Файл ${file.name} не является изображением`);
                selectedFiles.push(file);
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const div = document.createElement('div');
                    div.className = 'preview-item';
                    div.innerHTML = `<img src="${ev.target.result}" alt="Preview"><span class="preview-remove">×</span>`;
                    div.querySelector('.preview-remove').onclick = () => {
                        selectedFiles = selectedFiles.filter(f => f.name !== file.name);
                        div.remove();
                        if (photoCount) photoCount.textContent = `${selectedFiles.length}/${MAX_PHOTOS} изображений`;
                    };
                    if (photoPreviews) photoPreviews.appendChild(div);
                };
                reader.readAsDataURL(file);
            });
            if (photoCount) photoCount.textContent = `${selectedFiles.length}/${MAX_PHOTOS} изображений`;
            photoInput.value = '';
        };
    }

    // ===== ЗАГРУЗКА ФОТО =====
    async function uploadPhotos(files, reviewId) {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        const urls = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const ext = file.name.split('.').pop();
            const path = `reviews/review-${reviewId}-${Date.now()}-${i}.${ext}`;
            try {
                await supabase.storage.from('review-photos').upload(path, file);
                const { data: { publicUrl } } = supabase.storage.from('review-photos').getPublicUrl(path);
                urls.push(publicUrl);
            } catch(e) { console.error(e); }
        }
        return urls;
    }

    // ===== ЗАГРУЗКА ОТЗЫВОВ =====
    async function loadReviews() {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            const { data: reviews } = await supabase.from('v_recent_reviews').select('*');
            const container = document.querySelector('.reviews-list');
            if (!container) return;
            container.innerHTML = reviews?.length ? reviews.map(r => {
                const date = r.review_date ? new Date(r.review_date).toLocaleDateString('ru-RU') : 'Дата не указана';
                const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                let photosHtml = '';
                if (r.photos?.length) photosHtml = `<div class="review-photos">${r.photos.map(p => `<img src="${p}" class="review-photo" loading="lazy">`).join('')}</div>`;
                return `<div class="review-card">
                    <div class="review-header"><span class="review-author">${escapeHtml(r.user_name)}</span><span class="review-date">${date}</span></div>
                    <div class="review-rating">${stars.split('').map(s => `<span class="star">${s}</span>`).join('')}</div>
                    <p class="review-text">${escapeHtml(r.review_text)}</p>
                    <div class="review-product">Товар: ${escapeHtml(r.product_name)}</div>
                    ${photosHtml}
                </div>`;
            }).join('') : '<p class="no-reviews">Пока нет отзывов. Будьте первым!</p>';
        } catch(e) { console.error(e); }
    }
    
    function escapeHtml(t) { if (!t) return ''; const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

    // Отложенная загрузка отзывов
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => loadReviews(), { timeout: 2000 });
    } else {
        setTimeout(() => loadReviews(), 100);
    }

    // ===== ФОРМА =====
    const form = document.querySelector('.review-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            const name = document.querySelector('.form-input').value.trim();
            const text = document.querySelector('.form-textarea').value.trim();
            const agreement = document.getElementById('agreement');
            const rating = document.querySelectorAll('.rating-input .star.active').length;
            if (!name || !text) return alert('Заполните все поля!');
            if (!agreement?.checked) return alert('Согласие на обработку данных обязательно');
            try {
                const { data: id } = await supabase.rpc('add_review', { p_product_id: 1, p_user_name: name, p_rating: rating, p_review_text: text, p_photos: [] });
                if (selectedFiles.length) {
                    const urls = await uploadPhotos(selectedFiles, id);
                    await supabase.from('reviews').update({ photos: urls }).eq('id', id);
                }
                document.querySelector('.form-input').value = '';
                document.querySelector('.form-textarea').value = '';
                if (agreement) agreement.checked = false;
                document.querySelectorAll('.rating-input .star').forEach(s => s.classList.remove('active'));
                selectedFiles = [];
                if (photoPreviews) photoPreviews.innerHTML = '';
                if (photoCount) photoCount.textContent = `0/${MAX_PHOTOS} изображений`;
                alert('✅ Отзыв добавлен!');
                loadReviews();
            } catch(err) { alert('❌ Ошибка: ' + err.message); }
        };
    }

    // ===== ПОДРОБНЕЕ (ИСПРАВЛЕНО) =====
    const infoMap = {
        1: { title: 'Винтажный жакет', desc: 'Элегантный винтажный жакет 80-х годов. Прекрасное состояние, натуральные материалы.', details: ['📍 Материал: 100% хлопок', '📍 Размер: M (44-46)', '📍 Цвет: бежевый', '📍 Состояние: отличное'], price: '2 990 ₽' },
        2: { title: 'Винтажный пиджак', desc: 'Классический пиджак в стиле oversize. Отличный вариант для создания стильного образа.', details: ['📍 Материал: шерсть 70% / полиэстер 30%', '📍 Размер: L (48-50)', '📍 Цвет: темно-синий', '📍 Состояние: хорошее'], price: '1 990 ₽' },
        3: { title: 'Винтажные джинсы', desc: 'Аутентичные джинсы прямого кроя 90-х годов. Высокое качество и неповторимый стиль.', details: ['📍 Материал: 100% хлопок', '📍 Размер: 32/34 (48-50)', '📍 Цвет: светло-синий', '📍 Состояние: хорошее'], price: '2 490 ₽' }
    };
    
    document.querySelectorAll('.product-link').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const id = link.dataset.product;
            const card = link.closest('.product-card');
            const existing = card.querySelector('.product-info');
            if (existing) { existing.remove(); return; }
            const info = infoMap[id];
            if (!info) return;
            const div = document.createElement('div');
            div.className = 'product-info';
            div.innerHTML = `<div><h4>${info.title}</h4><p>${info.desc}</p><ul>${info.details.map(d => `<li>${d}</li>`).join('')}</ul><p class="price">${info.price}</p><button class="close-info">Закрыть</button></div>`;
            card.appendChild(div);
            div.querySelector('.close-info').onclick = () => div.remove();
        };
    });

    // ===== ПЛАВНАЯ ПРОКРУТКА (ИСПРАВЛЕНО) =====
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.onclick = (e) => {
            e.preventDefault();
            const href = a.getAttribute('href');
            // Проверяем, что href не пустой и не просто "#"
            if (href && href !== '#' && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        };
    });
});