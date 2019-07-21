jQuery(document).ready(function($){

    $('.toggle-menu').on('click', function (e) {
        e.preventDefault();
        $('body').toggleClass('hide-menu');
    });

    $('#btn-screen-options').on('click', function (e) {
        e.preventDefault();
        $('#screen-options').toggleClass('hide');
    });

    
});


