import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

import './css/loader.css';

// імпорт функцій
import { getImagesByQuery } from './js/pixabay-api.js';
import {
  createGallery,
  clearGallery,
  showLoader,
  hideLoader,
  showLoadMoreButton,
  hideLoadMoreButton,
} from './js/render-functions.js';

// отримуємо потрібні елементи з HTML
const formEl = document.querySelector('.form');
const loadMoreBtnEl = document.querySelector('.load-more');

// два різні повідомлення (бо це два різні стани)
const noResultsEl = document.querySelector('.no-results');
const endMessageEl = document.querySelector('.end-message');

// глобальні змінні
let currentQuery = ''; // останній підтверджений запит
let currentPage = 1; // поточна сторінка для цього запиту
let totalHits = 0; // кількість результатів які повертає API для цього запиту
const PER_PAGE = 15; // кількість елементів на сторінці

// додаємо обробник сабміту форми
if (formEl) {
  formEl.addEventListener('submit', onFormSubmit);
}

if (loadMoreBtnEl) {
  loadMoreBtnEl.addEventListener('click', onLoadMoreClick);
}

hideLoadMoreButton();

/*============================================================
  основна функція обробки сабміту форми
 ============================================================*/
async function onFormSubmit(event) {
  event.preventDefault();

  // отримуємо значення полів форми
  const query = event.target.elements['search-text'].value.trim();

  // валідація порожнього запиту
  if (query === '') {
    iziToast.error({
      message: 'Please enter a search query.',
      position: 'topRight',
    });
    return;
  }

  // оновлюємо стан додатку для нового пошукового запиту
  currentQuery = query;
  currentPage = 1;
  totalHits = 0;

  // готуємо інтерфейс до нового пошуку
  hideNoResultsMessage();
  hideEndMessage();
  clearGallery();
  hideLoadMoreButton();
  showLoader();

  try {
    const data = await getImagesByQuery(currentQuery, currentPage);

    // потрібно знати totalHits, щоб зрозуміти, коли приховувати кнопку Load More
    totalHits = data.totalHits;

    // якщо нічого не знайдено — показуємо повідомлення "no results"
    if (!data.hits || data.hits.length === 0) {
      showNoResultsMessage();
      hideLoadMoreButton();
      return;
    }

    // при успішному пошуку
    createGallery(data.hits);

    // кількість завантажених зображень на цей момент
    const loadedSoFar = currentPage * PER_PAGE;

    // якщо завантажили всі можливі зображення — кінець колекції
    if (loadedSoFar >= totalHits) {
      handleEndOfResults();
    } else {
      // якщо є ще що завантажувати - показуємо кнопку
      showLoadMoreButton();
    }
  } catch (error) {
    // якщо сталася помилка мережі/запиту
    iziToast.error({
      message: 'Something went wrong. Please try again later.',
      position: 'topRight',
    });
  } finally {
    // при будь-якому результаті ховаємо лоадер
    hideLoader();
  }
}

/*============================================================
  обробник кліку по кнопці Load More
 ============================================================*/
async function onLoadMoreClick() {
  // переходимо на наступну сторінку
  currentPage += 1;

  hideLoadMoreButton();
  showLoader();

  try {
    const data = await getImagesByQuery(currentQuery, currentPage);

    // захист - якщо раптом прийшло 0 результатів
    if (!data.hits || data.hits.length === 0) {
      handleEndOfResults();
      return;
    }

    createGallery(data.hits); // додаємо нові зображення в галерею
    smoothScrollAfterAppend(); // плавний скрол після додавання нових зображень

    // кількість завантажених зображень на цей момент
    const loadedSoFar = currentPage * PER_PAGE;

    // якщо завантажили всі можливі зображення — кінець колекції
    if (loadedSoFar >= totalHits) {
      handleEndOfResults();
    } else {
      // якщо є ще що завантажувати - показуємо кнопку
      showLoadMoreButton();
    }
  } catch (error) {
    iziToast.error({
      message: 'Something went wrong. Please try again later.',
      position: 'topRight',
    });
  } finally {
    hideLoader(); // при будь-якому результаті ховаємо лоадер
  }
}

/*============================================================
  допоміжні функції logic для показу/приховування повідомлень
 ============================================================*/
function hideNoResultsMessage() {
  if (!noResultsEl) return;
  noResultsEl.classList.add('is-hidden');
}

function showNoResultsMessage() {
  if (!noResultsEl) return;
  noResultsEl.classList.remove('is-hidden');
}

function hideEndMessage() {
  if (!endMessageEl) return;
  endMessageEl.classList.add('is-hidden');
}

function showEndMessage() {
  if (!endMessageEl) return;
  endMessageEl.classList.remove('is-hidden');
}

function handleEndOfResults() {
  hideLoadMoreButton();
  showEndMessage();
}


/*============================================================
  допоміжна функція для плавного скрола після додавання нових зображень
 ============================================================*/
 function smoothScrollAfterAppend() {
  // отримуємо доступ до першої картки галереї
  const firstCard = document.querySelector('.gallery-item');
  if (!firstCard) return;

  // визначаємо висоту картки за допомогою getBoundingClientRect()
  const { height: cardHeight } = firstCard.getBoundingClientRect();

  // визначаємо висоту прокрутки - подвійна висота картки
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}