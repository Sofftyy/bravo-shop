document.addEventListener('DOMContentLoaded', function() {
    // ===== МЕНЮ (БУРГЕР) =====
    const burgerMenu = document.getElementById('burgerMenu');
    const navMenu = document.getElementById('navMenu');
    
    if (burgerMenu && navMenu) {
        burgerMenu.addEventListener('click', function() {
            burgerMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        const menuLinks = navMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                burgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // ===== ПЕРЕКЛЮЧЕНИЕ ТОВАРОВ =====
    const catalogGrid = document.getElementById('catalogGrid');
    const prevArrow = document.querySelector('.prev-arrow');
    const nextArrow = document.querySelector('.next-arrow');
    let currentIndex = 0;

    if (catalogGrid && prevArrow && nextArrow) {
        const products = Array.from(catalogGrid.children);
        const totalProducts = products.length;
        
        function showProducts(index) {
            products.forEach(product => {
                product.style.display = 'none';
            });
            
            for (let i = 0; i < 2; i++) {
                const productIndex = (index + i) % totalProducts;
                products[productIndex].style.display = 'flex';
            }
        }
        
        prevArrow.addEventListener('click', function() {
            currentIndex = (currentIndex - 1 + totalProducts) % totalProducts;
            showProducts(currentIndex);
        });
        
        nextArrow.addEventListener('click', function() {
            currentIndex = (currentIndex + 1) % totalProducts;
            showProducts(currentIndex);
        });
        
        showProducts(0);
    }

    // ===== РЕЙТИНГ =====
    const stars = document.querySelectorAll('.rating-input .star');
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            stars.forEach(s => s.classList.remove('active'));
            for(let i = 0; i <= index; i++) {
                stars[i].classList.add('active');
            }
        });
    });

    // ===== НАСТРОЙКИ SUPABASE =====
    const SUPABASE_URL = 'https://wrvovgkrrguvcvzeoyne.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_oq84G50obqgmOAj60kUPmw_YPrq-DpT';

    // ===== ЗАГРУЗКА ФОТО (ИСПРАВЛЕНАЯ - РАБОТАЕТ) =====
    const photoUpload = document.getElementById('photoUpload');
    const photoInput = document.getElementById('photoInput');
    const photoPreviews = document.getElementById('photoPreviews');
    const photoCount = document.getElementById('photoCount');
    let selectedFiles = [];
    const MAX_PHOTOS = 3;

    console.log('🔍 photoUpload:', photoUpload);
    console.log('🔍 photoInput:', photoInput);

    if (photoUpload && photoInput) {
        console.log('✅ Элементы найдены');
        
        // Убираем все старые обработчики
        const newPhotoUpload = photoUpload.cloneNode(true);
        photoUpload.parentNode.replaceChild(newPhotoUpload, photoUpload);
        
        const newPhotoInput = photoInput.cloneNode(true);
        photoInput.parentNode.replaceChild(newPhotoInput, photoInput);
        
        // Получаем обновлённые ссылки
        const finalPhotoUpload = document.getElementById('photoUpload');
        const finalPhotoInput = document.getElementById('photoInput');
        
        // Обработчик клика
        finalPhotoUpload.addEventListener('click', function(e) {
            console.log('🖱️ Клик по photoUpload');
            if (!e.target.classList.contains('preview-remove')) {
                e.preventDefault();
                console.log('👉 Открываем диалог выбора файла');
                finalPhotoInput.click();
            }
        });
        
        // Обработчик выбора файлов
        finalPhotoInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            console.log('📁 Выбрано файлов:', files.length);
            
            if (selectedFiles.length + files.length > MAX_PHOTOS) {
                alert(`Можно загрузить не более ${MAX_PHOTOS} фото`);
                return;
            }
            
            files.forEach(file => {
                if (file.size > 5 * 1024 * 1024) {
                    alert(`Файл ${file.name} слишком большой (макс. 5MB)`);
                    return;
                }
                if (!file.type.startsWith('image/')) {
                    alert(`Файл ${file.name} не является изображением`);
                    return;
                }
                selectedFiles.push(file);
                displayPreview(file);
            });
            
            updatePhotoCount();
            finalPhotoInput.value = '';
        });
        
        function displayPreview(file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'preview-item';
                previewDiv.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <span class="preview-remove" data-filename="${file.name}">×</span>
                `;
                previewDiv.querySelector('.preview-remove').addEventListener('click', function() {
                    selectedFiles = selectedFiles.filter(f => f.name !== file.name);
                    previewDiv.remove();
                    updatePhotoCount();
                });
                if (photoPreviews) photoPreviews.appendChild(previewDiv);
            };
            reader.readAsDataURL(file);
        }
        
        function updatePhotoCount() {
            if (photoCount) {
                photoCount.textContent = `${selectedFiles.length}/${MAX_PHOTOS} изображений`;
            }
        }
    } else {
        console.error('❌ Элементы для фото не найдены!');
    }

    // ===== ЗАГРУЗКА ФОТО В SUPABASE =====
    async function uploadPhotos(files, reviewId) {
        const uploadedUrls = [];
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `review-${reviewId}-${Date.now()}-${i}.${fileExt}`;
            const filePath = `reviews/${fileName}`;

            try {
                const { error } = await supabase.storage
                    .from('review-photos')
                    .upload(filePath, file);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('review-photos')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
                console.log('✅ Фото загружено:', publicUrl);
            } catch (error) {
                console.error('Ошибка загрузки фото:', error);
            }
        }
        return uploadedUrls;
    }

    // ===== ЗАГРУЗКА ОТЗЫВОВ =====
    async function loadReviews() {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            
            const { data: reviews, error } = await supabase
                .from('v_recent_reviews')
                .select('*');

            if (error) throw error;

            const reviewsList = document.querySelector('.reviews-list');
            if (!reviewsList) return;
            reviewsList.innerHTML = '';
            
            if (reviews && reviews.length > 0) {
                reviews.forEach(review => {
                    const reviewCard = document.createElement('div');
                    reviewCard.className = 'review-card';
                    
                    const reviewDate = review.review_date 
                        ? new Date(review.review_date).toLocaleDateString('ru-RU')
                        : 'Дата не указана';
                    
                    const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    
                    let cardHtml = `
                        <div class="review-header">
                            <span class="review-author">${escapeHtml(review.user_name)}</span>
                            <span class="review-date">${reviewDate}</span>
                        </div>
                        <div class="review-rating">
                            ${starsHtml.split('').map(s => `<span class="star">${s}</span>`).join('')}
                        </div>
                        <p class="review-text">${escapeHtml(review.review_text)}</p>
                        <div class="review-product">Товар: ${escapeHtml(review.product_name)}</div>
                    `;
                    
                    if (review.photos && review.photos.length > 0) {
                        cardHtml += '<div class="review-photos">';
                        review.photos.forEach((photoUrl) => {
                            cardHtml += `<img src="${photoUrl}" alt="Фото отзыва" class="review-photo" loading="lazy">`;
                        });
                        cardHtml += '</div>';
                    }
                    
                    reviewCard.innerHTML = cardHtml;
                    reviewsList.appendChild(reviewCard);
                });
            } else {
                reviewsList.innerHTML = '<p class="no-reviews">Пока нет отзывов. Будьте первым!</p>';
            }
        } catch (error) {
            console.error('Ошибка при загрузке отзывов:', error);
        }
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== ФОРМА ОТЗЫВА =====
    const form = document.querySelector('.review-form');
    if(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

            const name = document.querySelector('.form-input').value.trim();
            const text = document.querySelector('.form-textarea').value.trim();
            const agreement = document.getElementById('agreement');
            const activeStars = document.querySelectorAll('.rating-input .star.active').length;

            if(!name || !text) {
                alert('Пожалуйста, заполните все поля!');
                return;
            }
            if(!agreement.checked) {
                alert('Необходимо согласие на обработку персональных данных');
                return;
            }

            try {
                const { data: reviewId, error: reviewError } = await supabase
                    .rpc('add_review', {
                        p_product_id: 1,
                        p_user_name: name,
                        p_rating: activeStars,
                        p_review_text: text,
                        p_photos: []
                    });

                if (reviewError) throw reviewError;

                if (selectedFiles.length > 0) {
                    const photoUrls = await uploadPhotos(selectedFiles, reviewId);
                    
                    await supabase
                        .from('reviews')
                        .update({ photos: photoUrls })
                        .eq('id', reviewId);
                }

                document.querySelector('.form-input').value = '';
                document.querySelector('.form-textarea').value = '';
                agreement.checked = false;
                document.querySelectorAll('.rating-input .star').forEach(s => s.classList.remove('active'));
                
                selectedFiles = [];
                if (photoPreviews) photoPreviews.innerHTML = '';
                updatePhotoCount();

                alert('✅ Отзыв успешно добавлен!');
                loadReviews();

            } catch (error) {
                console.error('❌ Ошибка:', error);
                alert('❌ Ошибка: ' + error.message);
            }
        });
    }

    // ===== КНОПКИ "ПОДРОБНЕЕ" =====
    document.querySelectorAll('.product-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.dataset.product;
            const productCard = this.closest('.product-card');
            
            const productInfo = {
                '1': {
                    title: 'Винтажный жакет',
                    description: 'Элегантный винтажный жакет 80-х годов. Прекрасное состояние, натуральные материалы.',
                    details: [
                        '📍 Материал: 100% хлопок',
                        '📍 Размер: M (44-46)',
                        '📍 Цвет: бежевый',
                        '📍 Состояние: отличное'
                    ],
                    price: '2 990 ₽'
                },
                '2': {
                    title: 'Винтажный пиджак',
                    description: 'Классический пиджак в стиле oversize. Отличный вариант для создания стильного образа.',
                    details: [
                        '📍 Материал: шерсть 70% / полиэстер 30%',
                        '📍 Размер: L (48-50)',
                        '📍 Цвет: темно-синий',
                        '📍 Состояние: хорошее'
                    ],
                    price: '1 990 ₽'
                },
                '3': {
                    title: 'Винтажные джинсы',
                    description: 'Аутентичные джинсы прямого кроя 90-х годов. Высокое качество и неповторимый стиль.',
                    details: [
                        '📍 Материал: 100% хлопок',
                        '📍 Размер: 32/34 (48-50)',
                        '📍 Цвет: светло-синий',
                        '📍 Состояние: хорошее'
                    ],
                    price: '2 490 ₽'
                }
            };
            
            const info = productInfo[productId];
            if (!info) return;
            
            const existingInfo = productCard.querySelector('.product-info');
            if (existingInfo) {
                existingInfo.remove();
            } else {
                const infoDiv = document.createElement('div');
                infoDiv.className = 'product-info';
                const detailsHtml = info.details.map(detail => `<li>${detail}</li>`).join('');
                
                infoDiv.innerHTML = `
                    <div>
                        <h4>${info.title}</h4>
                        <p>${info.description}</p>
                        <ul>${detailsHtml}</ul>
                        <p class="price">${info.price}</p>
                        <button class="close-info">Закрыть</button>
                    </div>
                `;
                productCard.appendChild(infoDiv);
                
                infoDiv.querySelector('.close-info').addEventListener('click', function() {
                    infoDiv.remove();
                });
            }
        });
    });

    // ===== ПЛАВНАЯ ПРОКРУТКА =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    loadReviews();
});