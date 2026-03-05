$(document).ready(function () {
    console.log("Script rodando!");

    let currentUser = localStorage.getItem("currentUser") || null;

    // Lógica para mostrar a seção correta na inicialização da página
    function initializePage() {
        const initialSection = window.location.hash || '#home';

        $('section').hide();
        $(initialSection).show();
        
        $('#nav_list a, #mobile_nav_list a').removeClass('active');
        $(`a[href="${initialSection}"]`).addClass('active');

        if (initialSection === '#home') {
            $('body').css('overflow-y', 'hidden');
        } else {
            $('body').css('overflow-y', 'auto');
        }

        if (initialSection === '#favoritos') {
            loadFavorites();
        }
    }

    // Função principal para trocar de seção
    function mostrarSecao(target) {
        if (!target || !target.startsWith('#') || $(target).is(':visible')) {
            return;
        }

        // Define a rolagem ANTES da transição
        if (target === '#home') {
            $('body').css('overflow-y', 'hidden');
        } else {
            $('body').css('overflow-y', 'auto');
        }

        $('#nav_list a, #mobile_nav_list a').removeClass('active');
        $(`a[href="${target}"]`).addClass('active');

        $('section:visible').fadeOut(300, function () {
            $(target).fadeIn(400);
            $(window).scrollTop(0); // Leva o usuário para o topo da nova seção
            if (target === '#favoritos') {
                loadFavorites();
            }
        });
    }

    // --- MANIPULADORES DE EVENTOS (CLICKS) ---

    // Navegação principal e mobile
    $('#nav_list a, #mobile_nav_list a, #cta_buttons a').on('click', function (e) {
        e.preventDefault();
        const target = $(this).attr('href') || '#menu';
        mostrarSecao(target);
    });

    // Filtros do cardápio
    $('.filtro-btn').on('click', function () {
        const filtro = $(this).data('filtro');
        $('.filtro-btn').removeClass('active');
        $(this).addClass('active');
        if (filtro === 'todos') {
            $('.dish').fadeIn(300);
        } else {
            $('.dish').fadeOut(300).promise().done(function() {
                $(`.dish[data-proteina="${filtro}"]`).fadeIn(300);
            });
        }
    });

    // --- LÓGICA AJUSTADA PARA O BOTÃO "VER MAIS" ---
    $(document).on("click", ".ver-mais-btn", function () {
        const currentCard = $(this).closest('.dish');
        const currentExtraInfo = currentCard.find('.extra-info');
        const isOpening = !currentExtraInfo.is(':visible');

        // Fecha todos os outros cards que estiverem abertos
        $('.extra-info').not(currentExtraInfo).slideUp(200);
        // Reseta o texto de todos os outros botões
        $('.ver-mais-btn').not(this).text('Ver mais');
        
        // Abre ou fecha o card clicado
        currentExtraInfo.slideToggle(200);
        $(this).text(isOpening ? 'Ver menos' : 'Ver mais');

        $(this).blur();
    });

    // Botão de Favoritar
    $(document).on('click', '.dish-heart', function () {
        if (!currentUser) {
            alert('Faça login para favoritar.');
            return;
        }
        const dish = $(this).closest('.dish');
        const name = dish.find('.dish-title').text();
        let users = JSON.parse(localStorage.getItem('users')) || {};
        let userData = users[currentUser];
        if (!userData.favorites) userData.favorites = [];

        if (userData.favorites.includes(name)) {
            userData.favorites = userData.favorites.filter(fav => fav !== name);
            $(this).removeClass('active');
        } else {
            userData.favorites.push(name);
            $(this).addClass('active');
        }
        users[currentUser] = userData;
        localStorage.setItem('users', JSON.stringify(users));
        if ($('#favoritos').is(':visible')) {
            loadFavorites();
        }
    });

    // --- FUNÇÕES DE USUÁRIO E ESTADO ---

    // Carregar favoritos na seção
    function loadFavorites() {
        if (!currentUser) return;
        const users = JSON.parse(localStorage.getItem('users')) || {};
        const userData = users[currentUser];
        const list = $('#favorites-list');
        list.empty();
        if (!userData || !userData.favorites || userData.favorites.length === 0) {
            list.html('<p>Você ainda não favoritou nenhum prato.</p>');
            return;
        }
        $('.dish').each(function () {
            const title = $(this).find('.dish-title').text();
            if (userData.favorites.includes(title)) {
                const clone = $(this).clone();
                clone.find('.dish-heart').remove();
                // Garante que os detalhes do clone comecem fechados
                clone.find('.extra-info').hide();
                clone.find('.ver-mais-btn').text('Ver mais');
                list.append(clone);
                clone.show();
            }
        });
    }

    // Marcar corações dos pratos favoritados
    function loadFavoriteHearts() {
        if (!currentUser) return;
        const users = JSON.parse(localStorage.getItem('users')) || {};
        const favorites = users[currentUser]?.favorites || [];
        $('.dish-heart').removeClass('active');
        $('.dish').each(function () {
            const title = $(this).find('.dish-title').text();
            if (favorites.includes(title)) {
                $(this).find('.dish-heart').addClass('active');
            }
        });
    }

    // Atualizar UI com o estado do login
    function updateUserUI() {
        if (currentUser) {
            $('#login-btn').html(`<span>Olá, ${currentUser}</span><button id="logout-btn">Sair</button>`);
            $('#logout-btn').on('click', e => { e.stopPropagation(); logout(); });
        } else {
            $('#login-btn').text('Login').off('click').on('click', () => $('#login-modal').fadeIn());
        }
        loadFavoriteHearts();
    }
    window.login = function () {
        const username = $('#auth-username').val();
        const password = $('#auth-password').val();
        const users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[username] && users[username].password === password) {
            currentUser = username;
            localStorage.setItem("currentUser", currentUser);
            $('#login-modal').fadeOut();
            updateUserUI();
        } else {
            alert("Usuário ou senha inválido.");
        }
    };
    window.register = function () {
        const username = $('#auth-username').val();
        const password = $('#auth-password').val();
        if (!username || !password) return alert('Preencha os campos');
        let users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[username]) return alert('Usuário já existe');
        users[username] = { password, favorites: [] };
        localStorage.setItem('users', JSON.stringify(users));
        alert('Cadastro realizado!');
    };
    function logout() {
        currentUser = null;
        localStorage.removeItem("currentUser");
        $('#favorites-list').empty();
        updateUserUI();
    }
    window.closeModal = () => $('#login-modal').fadeOut();
    
    // --- INICIALIZAÇÃO ---
    initializePage();
    updateUserUI();

    // Outros inicializadores
    $('#mobile_btn').on('click', () => {
        $('#mobile_menu').toggleClass('active');
        $('#mobile_btn').find('i').toggleClass('fa-x fa-bars');
    });

    $("#toggle-dark").click(() => {
        $("body").toggleClass("dark");
        const isDark = $("body").hasClass("dark");
        $("#toggle-dark").text(isDark ? "☀️ Modo Claro" : "🌙 Modo Escuro");
    });
});