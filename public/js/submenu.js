// JavaScript para submenu de administração
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar funcionalidade ao submenu
    const submenuItems = document.querySelectorAll('.dropdown-submenu');
    
    submenuItems.forEach(function(item) {
        const toggle = item.querySelector('.dropdown-toggle');
        const menu = item.querySelector('.dropdown-menu');
        
        if (toggle && menu) {
            // Mostrar submenu no hover
            item.addEventListener('mouseenter', function() {
                menu.style.display = 'block';
            });
            
            // Esconder submenu quando sair
            item.addEventListener('mouseleave', function() {
                menu.style.display = 'none';
            });
            
            // Prevenir fechamento do dropdown pai
            menu.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    });
});
