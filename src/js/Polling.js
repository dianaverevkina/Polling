import { interval, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { catchError, concatMap } from 'rxjs/operators';

export default class Polling {
  constructor() {
    this.container = null;
    this.subscription = null;
  }

  init() {
    this.bindToDOM();
    this.subscribeOnNewMessages();
  }

  bindToDOM() {
    this.container = document.querySelector('.polling__container');
    this.messagesContainer = this.container.querySelector('.polling__messages');
  }

  // Подписываемся на новые сообщения
  subscribeOnNewMessages() {
    if (this.subscription) return;

    const interval$ = interval(5000);
    this.subscription = interval$.pipe(
      concatMap(() => ajax.getJSON('http://localhost:3000/messages/unread')),
      catchError(() => of({ messages: [] })),
    ).subscribe((response) => {
      if (response.status !== 'ok') return;

      const sortedMessages = this.sortMessages(response.messages);
      this.renderMessages(sortedMessages);
    });
  }

  // Сортируем сообщения
  sortMessages(messages) {
    return messages.sort((a, b) => Date.parse(a.recieved) - Date.parse(b.recieved));
  }

  // Создаем сообщения
  renderMessages(messages) {
    messages.forEach((message) => {
      this.messagesList = [...this.messagesContainer.querySelectorAll('.message')];
      const existedMessage = this.messagesList.find((el) => el.dataset.id === message.id);

      if (existedMessage) return;

      this.renderItem(message);
    });
  }

  // Рендерим сообщение
  renderItem({
    id, from, subject, recieved, body,
  }) {
    const shortSubject = subject.length > 15 ? `${subject.slice(0, 14)}...` : subject;
    const message = document.createElement('div');
    message.classList.add('message');
    message.dataset.id = id;
    message.innerHTML = `
      <div class="message__content">
        <p class="message__email">${from}</p>
        <span class="message__date">${this.getDate(recieved)}</span>
      </div>
      <p class="message__subject">${shortSubject}</p>
      <p class="message__text">${body}</p>
    `;

    this.messagesContainer.prepend(message);
  }

  // Форматируем дату
  getDate(date) {
    const newDate = new Date(date);

    const formattedDate = newDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    const formattedTime = newDate.toLocaleTimeString('ru-RU', {
      hour: 'numeric',
      minute: 'numeric',
    });

    return `${formattedTime} ${formattedDate}`;
  }
}
