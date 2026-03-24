// ========== КОНФИГУРАЦИЯ SUPABASE ==========
// ЗАМЕНИ НА СВОИ ДАННЫЕ ИЗ SUPABASE!
const SUPABASE_URL = 'https://wrvovgkrrguvcvzeoyne.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oq84G50obqgmOAj60kUPmw_YPrq-DpT';

// Инициализация Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Переменная для хранения выбранных фото
let selectedFiles = [];

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Сайт загружен, инициализация...');
    
    initBurgerMenu();
    initProductSlider();
    loadReviewsFromSupabase();
    initRatingStars();
    initReviewForm();
    initSmoothScroll();
    initPhotoUpload();
    
    console.log('Все компоненты инициализированы');
});

// ========== БУРГЕР-МЕНЮ ==========
function initBurgerMenu() {
    const burgerMenu = document.getElementById('burgerMenu');
    const navMenu = document.getElementById('navMenu');
    
    if (burgerMenu && navMenu) {
        burgerMenu.addEventListener('click', function() {
            burgerMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        const menuLinks = navMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                burgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// ========== СЛАЙДЕР ТОВАРОВ ==========
function initProductSlider() {
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
}

// ========== ЗВЕЗДЫ РЕЙТИНГА ==========
function initRatingStars() {
    const stars = document.querySelectorAll('.rating-input .star');
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            stars.forEach(s => s.classList.remove('active'));
            for(let i = 0; i <= index; i++) {
                stars[i].classList.add('active');
            }
        });
    });
}

// ========== ЗАГРУЗКА ОТЗЫВОВ ИЗ SUPABASE ==========
async function loadReviewsFromSupabase() {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    reviewsList.innerHTML = '<div style="text-align: center; padding: 20px;">Загрузка отзывов...</div>';
    
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            reviewsList.innerHTML = '<div style="text-align: center; padding: 20px;">Пока нет отзывов. Будьте первым!</div>';
            return;
        }
        
        reviewsList.innerHTML = '';
        
        data.forEach(review => {
            const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            
            let date = review.review_date || review.created_at;
            if (date) {
                const d = new Date(date);
                date = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
            } else {
                date = 'Дата неизвестна';
            }
            
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${escapeHtml(review.user_name)}</span>
                    <span class="review-date">${date}</span>
                </div>
                <div class="review-rating">
                    ${starsHtml.split('').map(s => `<span class="star">${s}</span>`).join('')}
                </div>
                <p class="review-text">${escapeHtml(review.review_text)}</p>
                ${review.photos && review.photos.length > 0 ? `
                    <div class="review-photos">
                        ${review.photos.map(photo => `<img src="${photo}" class="review-photo" alt="Фото отзыва">`).join('')}
                    </div>
                ` : ''}
            `;
            reviewsList.appendChild(reviewCard);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        reviewsList.innerHTML = '<div style="text-align: center; padding: 20px;">Ошибка загрузки отзывов</div>';
    }
}

// ========== ДОБАВЛЕНИЕ ОТЗЫВА В SUPABASE ==========
async function addReviewToSupabase(name, rating, text, photoUrls) {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert([
                {
                    user_name: name,
                    rating: rating,
                    review_text: text,
                    product_id: 1,
                    photos: photoUrls || []
                }
            ])
            .select();
        
        if (error) throw error;
        
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Ошибка добавления отзыва:', error);
        return { success: false, error: error.message };
    }
}

// ========== ЗАГРУЗКА ФОТО В SUPABASE STORAGE ==========
async function uploadPhotosToSupabase(files, reviewId) {
    const photoUrls = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${reviewId}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `reviews/${fileName}`;
        
        try {
            const { data, error } = await supabase.storage
                .from('review-photos')
                .upload(filePath, file);
            
            if (error) throw error;
            
            const { data: urlData } = supabase.storage
                .from('review-photos')
                .getPublicUrl(filePath);
            
            photoUrls.push(urlData.publicUrl);
        } catch (error) {
            console.error('Ошибка загрузки фото:', error);
        }
    }
    
    return photoUrls;
}

// ========== ФОРМА ОТЗЫВА ==========
function initReviewForm() {
    const form = document.querySelector('.review-form');
    if(!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('reviewName')?.value.trim();
        const text = document.getElementById('reviewText')?.value.trim();
        const agreement = document.getElementById('agreement');
        const activeStars = document.querySelectorAll('.rating-input .star.active').length;
        
        if(!name || !text) {
            alert('Пожалуйста, заполните все поля!');
            return;
        }
        
        if(activeStars === 0) {
            alert('Пожалуйста, поставьте оценку!');
            return;
        }
        
        if(!agreement?.checked) {
            alert('Необходимо согласие на обработку персональных данных');
            return;
        }
        
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        
        // Сначала создаем отзыв, чтобы получить ID
        const result = await addReviewToSupabase(name, activeStars, text, []);
        
        if (result.success) {
            const reviewId = result.data.id;
            
            // Загружаем фото, если они есть
            let photoUrls = [];
            if (selectedFiles.length > 0) {
                photoUrls = await uploadPhotosToSupabase(selectedFiles, reviewId);
                
                // Обновляем отзыв с ссылками на фото
                if (photoUrls.length > 0) {
                    await supabase
                        .from('reviews')
                        .update({ photos: photoUrls })
                        .eq('id', reviewId);
                }
            }
            
            // Перезагружаем отзывы
            await loadReviewsFromSupabase();
            
            // Очищаем форму
            document.getElementById('reviewName').value = '';
            document.getElementById('reviewText').value = '';
            agreement.checked = false;
            document.querySelectorAll('.rating-input .star').forEach(s => s.classList.remove('active'));
            selectedFiles = [];
            updatePhotoUploadDisplay();
            
            alert('Спасибо за ваш отзыв!');
        } else {
            alert('Ошибка при сохранении: ' + result.error);
        }
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить';
    });
}

// ========== ПЛАВНАЯ ПРОКРУТКА ==========
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ========== ЗАГРУЗКА ФОТО ==========
function initPhotoUpload() {
    const photoUploadBtn = document.getElementById('photoUploadBtn');
    const photoInput = document.getElementById('photoInput');
    
    if (photoUploadBtn && photoInput) {
        photoUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            photoInput.click();
        });
        
        photoInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            const newFiles = files.slice(0, 3 - selectedFiles.length);
            
            if (newFiles.length < files.length) {
                alert('Можно загрузить не более 3 фото');
            }
            
            selectedFiles = [...selectedFiles, ...newFiles];
            updatePhotoUploadDisplay();
            
            photoInput.value = '';
        });
    }
}

function updatePhotoUploadDisplay() {
    const photoUploadBtn = document.getElementById('photoUploadBtn');
    if (!photoUploadBtn) return;
    
    const photoLabel = photoUploadBtn.querySelector('.photo-label');
    const photoNote = photoUploadBtn.querySelector('.photo-note');
    
    if (selectedFiles.length > 0) {
        photoLabel.textContent = `Выбрано ${selectedFiles.length} фото`;
        photoNote.textContent = selectedFiles.map(f => f.name.substring(0, 20)).join(', ');
        photoUploadBtn.style.backgroundColor = '#e8f0fe';
    } else {
        photoLabel.textContent = 'Добавить фото';
        photoNote.textContent = 'до 3 изображений';
        photoUploadBtn.style.backgroundColor = '';
    }
}

// ========== ЭКРАНИРОВАНИЕ HTML ==========
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}