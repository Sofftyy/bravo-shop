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
    const SUPABASE_KEY = 'sb_publishable_oq84G50obqgmOAj60kUPmw_YPrq-DpT'; // ключ

    // ===== ЗАГРУЗКА ФОТО =====
    const photoUpload = document.getElementById('photoUpload');
    const photoInput = document.getElementById('photoInput');
    const photoPreviews = document.getElementById('photoPreviews');
    const photoCount = document.getElementById('photoCount');
    let selectedFiles = [];
    const MAX_PHOTOS = 3;

    // Отладка: проверяем, найдены ли элементы
    console.log('🔍 Поиск элементов для фото:');
    console.log('photoUpload:', photoUpload);
    console.log('photoInput:', photoInput);
    console.log('photoPreviews:', photoPreviews);
    console.log('photoCount:', photoCount);

    if (photoUpload && photoInput) {
        console.log('✅ Элементы для фото найдены, инициализация...');
        
        // Клик по области загрузки
        photoUpload.addEventListener('click', function(e) {
            console.log('🖱️ Клик по photoUpload');
            // Не открываем диалог, если кликнули на кнопку удаления
            if (!e.target.classList.contains('preview-remove')) {
                console.log('👉 Открываю диалог выбора файла');
                photoInput.click();
            }
        });

        // Выбор файлов
        photoInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            console.log('📁 Выбрано файлов:', files.length);
            
            // Проверяем лимит
            if (selectedFiles.length + files.length > MAX_PHOTOS) {
                alert(`Можно загрузить не более ${MAX_PHOTOS} фото`);
                return;
            }

            // Обрабатываем каждый файл
            files.forEach(file => {
                console.log('Файл:', file.name, 'размер:', file.size);
                
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
            photoInput.value = ''; // Очищаем для возможности повторного выбора
        });
    } else {
        console.error('❌ Элементы для загрузки фото НЕ найдены!');
    }

    // Отображение превью выбранного фото
    function displayPreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'preview-item';
            previewDiv.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <span class="preview-remove" data-filename="${file.name}">×</span>
            `;
            
            // Кнопка удаления превью
            previewDiv.querySelector('.preview-remove').addEventListener('click', function() {
                const filename = this.dataset.filename;
                selectedFiles = selectedFiles.filter(f => f.name !== filename);
                this.closest('.preview-item').remove();
                updatePhotoCount();
                console.log('🗑️ Удалено фото:', filename);
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

    // ===== ФУНКЦИЯ ЗАГРУЗКИ ФАЙЛОВ В SUPABASE STORAGE =====
    async function uploadPhotos(files, reviewId) {
        const uploadedUrls = [];
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        console.log('📤 Начинаем загрузку фото для отзыва ID:', reviewId);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Создаём уникальное имя файла
            const fileExt = file.name.split('.').pop();
            const fileName = `review-${reviewId}-${Date.now()}-${i}.${fileExt}`;
            const filePath = `reviews/${fileName}`;

            try {
                console.log(`Загружаем файл ${i+1}/${files.length}:`, fileName);
                
                const { data, error } = await supabase.storage
                    .from('review-photos')
                    .upload(filePath, file);

                if (error) throw error;

                // Получаем публичный URL загруженного файла
                const { data: { publicUrl } } = supabase.storage
                    .from('review-photos')
                    .getPublicUrl(filePath);

                console.log('✅ Фото загружено, URL:', publicUrl);
                uploadedUrls.push(publicUrl);
                
            } catch (error) {
                console.error('❌ Ошибка загрузки фото:', error);
            }
        }
        
        console.log('📤 Загружено URL фото:', uploadedUrls);
        return uploadedUrls;
    }

    // ===== ЗАГРУЗКА ОТЗЫВОВ ИЗ БАЗЫ =====
    async function loadReviews() {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            
            console.log('📥 Загружаем отзывы...');
            
            const { data: reviews, error } = await supabase
                .from('v_recent_reviews')
                .select('*')
                .limit(20);

            if (error) throw error;

            console.log('📥 Загружено отзывов:', reviews?.length || 0);
            console.log('📥 Данные отзывов:', reviews);
            
            const reviewsList = document.querySelector('.reviews-list');
            
            if (reviews && reviews.length > 0) {
                reviewsList.innerHTML = '';
                
                reviews.forEach((review, index) => {
                    console.log(`\n📝 Отзыв #${index + 1}:`);
                    console.log('   Имя:', review.user_name);
                    console.log('   Рейтинг:', review.rating);
                    console.log('   Текст:', review.review_text);
                    console.log('   Фото (сырые данные):', review.photos);
                    
                    // Проверяем, есть ли фото
                    let photosHtml = '';
                    if (review.photos && review.photos.length > 0) {
                        console.log(`   ✅ Найдено фото:`, review.photos);
                        photosHtml = '<div class="review-photos">';
                        
                        // Проходим по каждому URL фото
                        review.photos.forEach((photoUrl, photoIndex) => {
                            console.log(`   🔗 Фото #${photoIndex + 1}:`, photoUrl);
                            photosHtml += `<img src="${photoUrl}" alt="Review photo ${photoIndex + 1}" class="review-photo" onerror="console.log('❌ Ошибка загрузки фото:', this.src)">`;
                        });
                        
                        photosHtml += '</div>';
                    } else {
                        console.log(`   ❌ Нет фото в этом отзыве`);
                    }
                    
                    const reviewCard = document.createElement('div');
                    reviewCard.className = 'review-card';
                    
                    const reviewDate = review.review_date 
                        ? new Date(review.review_date).toLocaleDateString('ru-RU')
                        : 'Дата не указана';
                    
                    const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    
                    reviewCard.innerHTML = `
                        <div class="review-header">
                            <span class="review-author">${review.user_name}</span>
                            <span class="review-date">${reviewDate}</span>
                        </div>
                        <div class="review-rating">
                            ${starsHtml.split('').map(s => `<span class="star">${s}</span>`).join('')}
                        </div>
                        <p class="review-text">${review.review_text}</p>
                        <div class="review-product">Товар: ${review.product_name}</div>
                        ${photosHtml}
                    `;
                    
                    reviewsList.appendChild(reviewCard);
                });
            } else {
                reviewsList.innerHTML = '<p class="no-reviews">Пока нет отзывов. Будьте первым!</p>';
            }
        } catch (error) {
            console.error('❌ Ошибка при загрузке отзывов:', error);
        }
    }

    // ===== ФОРМА ОТЗЫВА =====
    const form = document.querySelector('.review-form');
    if(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('📝 Форма отправлена');

            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

            const name = document.querySelector('.form-input').value.trim();
            const text = document.querySelector('.form-textarea').value.trim();
            const agreement = document.getElementById('agreement');
            const activeStars = document.querySelectorAll('.rating-input .star.active').length;

            console.log('Данные формы:', { name, text, rating: activeStars, photosCount: selectedFiles.length });

            if(!name || !text) {
                alert('Пожалуйста, заполните все поля!');
                return;
            }
            if(!agreement.checked) {
                alert('Необходимо согласие на обработку персональных данных');
                return;
            }

            try {
                // 1. Сначала создаём отзыв без фото, чтобы получить ID
                console.log('Создаём отзыв...');
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

                // 2. Загружаем фото, если есть
                let photoUrls = [];
                if (selectedFiles.length > 0) {
                    console.log('Загружаем фото...');
                    photoUrls = await uploadPhotos(selectedFiles, reviewId);
                    console.log('Загруженные URL фото:', photoUrls);
                    
                    // 3. Обновляем отзыв с ссылками на фото
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

                alert('✅ Отзыв успешно добавлен! Спасибо!');
                
                // Перезагружаем отзывы
                await loadReviews();
                console.log('✅ Отзывы перезагружены');

            } catch (error) {
                console.error('❌ Ошибка при отправке отзыва:', error);
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

    // ===== ЗАГРУЖАЕМ ОТЗЫВЫ ПРИ СТАРТЕ =====
    loadReviews();
});