const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const msgTemplate = document.querySelector('#message-template').innerHTML
const locTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix:true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message element
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visisble Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages containter
    const containterHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    // Check if at the bottom then autoscroll
    if(containterHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }


}
socket.on('message',(message) => {
    const html = Mustache.render(msgTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (location) => {
    const html = Mustache.render(locTemplate, {
        username: location.username,
        url : location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
 
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) =>{
    const html = Mustache.render(sidebarTemplate, {
      room, 
      users
    })

    document.querySelector('#sidebar').innerHTML = html
})



$messageForm.addEventListener('submit', (e) => {
    e.preventDefault() 

    $messageFormButton.setAttribute('disabled', 'disabled')

    const msg = e.target.elements.message.value

    socket.emit('sendMessage', msg, (error) => {
        $messageFormButton.removeAttribute('disabled', 'disabled')
        $messageFormInput.value = ''    
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log('Message was delivered!')
    })
})


$locationButton.addEventListener('click', (e) => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', { 
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location was shared...')
             $locationButton.removeAttribute('disabled', 'disabled')
        })
    })
    
})

socket.emit('join', { username, room } , (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})
