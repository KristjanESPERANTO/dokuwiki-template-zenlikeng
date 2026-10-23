// Zenlike JavaScript Functions

document.addEventListener('click', function (event) {
    const toggle = event.target.closest('#toggle_usertools');
    if (!toggle) return;

    const userTools = document.getElementById('usertools');
    if (!userTools) return;

    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    userTools.hidden = expanded;
});