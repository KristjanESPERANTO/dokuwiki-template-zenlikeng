// Zenlike JavaScript Functions

document.addEventListener('click', function (event) {
    if (!event.target.closest('#toggle_usertools')) return;

    const userTools = document.getElementById('usertools');
    if (userTools) userTools.hidden = !userTools.hidden;
});