document.addEventListener('DOMContentLoaded', function() {
    // ===== МЕНЮ =====
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
    
    if (catalogGrid && prevArrow && nextArrow) {
        const products = Array.from(catalogGrid.children);
        
        function swapProducts() {
            const firstProduct = products[0];
            const secondProduct = products[1];
            
            catalogGrid.innerHTML = '';
            catalogGrid.appendChild(secondProduct);
            catalogGrid.appendChild(firstProduct);
            
            products.reverse();
        }
        
        prevArrow.addEventListener('click', swapProducts);
        nextArrow.addEventListener('click', swapProducts);
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

    // ===== ЗАГРУЗКА ФОТО =====
    const photoUpload = document.getElementById('photoUpload');
    const photoInput = document.getElementById('photoInput');
    const photoPreviews = document.getElementById('photoPreviews');
    const photoCount = document.getElementById('photoCount');
    let selectedFiles = [];
    const MAX_PHOTOS = 3;

    if (photoUpload && photoInput) {
        photoUpload.addEventListener('click', function(e) {
            if (!e.target.classList.contains('preview-remove')) {
                photoInput.click();
            }
        });

        photoInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            
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
            photoInput.value = '';
        });
    }

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
                const filename = this.dataset.filename;
                selectedFiles = selectedFiles.filter(f => f.name !== filename);
                this.closest('.preview-item').remove();
                updatePhotoCount();
            });
            
            photoPreviews.appendChild(previewDiv);
        };
        reader.readAsDataURL(file);
    }

    function updatePhotoCount() {
        if (photoCount) {
            photoCount.textContent = `${selectedFiles.length}/${MAX_PHOTOS} изображений`;
        }
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

            console.log('📥 Загруженные отзывы:', reviews);

            const reviewsList = document.querySelector('.reviews-list');
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
                            <span class="review-author">${review.user_name}</span>
                            <span class="review-date">${reviewDate}</span>
                        </div>
                        <div class="review-rating">
                            ${starsHtml.split('').map(s => `<span class="star">${s}</span>`).join('')}
                        </div>
                        <p class="review-text">${review.review_text}</p>
                        <div class="review-product">Товар: ${review.product_name}</div>
                    `;
                    
                    // Добавляем фото, если они есть
                    if (review.photos && review.photos.length > 0) {
                        console.log('✅ Есть фото в отзыве:', review.photos);
                        cardHtml += '<div class="review-photos">';
                        review.photos.forEach((photoUrl, index) => {
                            cardHtml += `<img src="${photoUrl}" alt="Фото отзыва" class="review-photo" onload="console.log('Фото загружено')" onerror="console.log('Ошибка загрузки фото:', this.src)">`;
                        });
                        cardHtml += '</div>';
                    } else {
                        console.log('❌ Нет фото в отзыве');
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
                console.log('📝 Отправка отзыва...');
                console.log('Файлов для загрузки:', selectedFiles.length);

                // 1. Сначала создаём отзыв без фото
                const { data: reviewId, error: reviewError } = await supabase
                    .rpc('add_review', {
                        p_product_id: 1,
                        p_user_name: name,
                        p_rating: activeStars,
                        p_review_text: text,
                        p_photos: []
                    });

                if (reviewError) throw reviewError;
                console.log('✅ Отзыв создан, ID:', reviewId);

                // 2. Если есть фото, загружаем их
                if (selectedFiles.length > 0) {
                    console.log('📤 Загружаем фото...');
                    const photoUrls = await uploadPhotos(selectedFiles, reviewId);
                    console.log('✅ Фото загружены:', photoUrls);
                    
                    // 3. Обновляем отзыв с фото
                    const { error: updateError } = await supabase
                        .from('reviews')
                        .update({ photos: photoUrls })
                        .eq('id', reviewId);

                    if (updateError) throw updateError;
                    console.log('✅ Отзыв обновлён с фото');
                }

                // Очищаем форму
                document.querySelector('.form-input').value = '';
                document.querySelector('.form-textarea').value = '';
                agreement.checked = false;
                document.querySelectorAll('.rating-input .star').forEach(s => s.classList.remove('active'));
                
                // Очищаем фото
                selectedFiles = [];
                if (photoPreviews) photoPreviews.innerHTML = '';
                updatePhotoCount();

                alert('✅ Отзыв успешно добавлен!');
                
                // Перезагружаем отзывы
                await loadReviews();

            } catch (error) {
                console.error('❌ Ошибка:', error);
                alert('❌ Ошибка: ' + error.message);
            }
        });
    }

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

    // ===== ЗАГРУЖАЕМ ОТЗЫВЫ =====
    loadReviews();
});