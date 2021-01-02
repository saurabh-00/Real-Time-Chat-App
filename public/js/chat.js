const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild;

    // height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // visible height
    const visibleHeight = $messages.offsetHeight;

    // height of messages container
    const containerHeight = $messages.scrollHeight;

    // how far scrolled from top
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = containerHeight;
    }
}

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, { username: message.username, message: message.text, createdAt: moment(message.createdAt).format('h:mm a') });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locationTemplate, { username: message.username, url: message.url, createdAt: moment(message.createdAt).format('h:mm a') });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    console.log(room, users);
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $messageFormButton.disabled = true;
    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (msg) => {
        $messageFormButton.disabled = false;
        $messageFormInput.value = '';
        $messageFormInput.focus();
        console.log(msg);
    });
});

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert("Geolocation doesn't supported by your browser");
    }
    $sendLocationButton.disabled = true;
    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }
        socket.emit('sendLocation', location, (msg) => {
            $sendLocationButton.disabled = false;
            console.log(msg);
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});