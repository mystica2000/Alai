function initEvents() {
    console.log("events!");

    document.getElementById("stream").addEventListener("click", () => {
        toggleViews('streaming', 'recording')
    })

    document.getElementById("record").addEventListener("click", () => {
        toggleViews('recording', 'streaming')
    })
}

function toggleViews(showClass, hideClass) {
    document.querySelector(`.${showClass}`).classList.replace('hide', 'show');
    document.querySelector(`.${hideClass}`).classList.replace('show', 'hide');
}


document.addEventListener("DOMContentLoaded", () => {
    initEvents();
})