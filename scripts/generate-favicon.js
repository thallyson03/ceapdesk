const fs = require('fs');
const path = require('path');

console.log('🎨 Gerando favicon para o Sistema de Tickets...');

// Conteúdo do favicon SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="32" height="32">
  <!-- Background -->
  <rect width="64" height="64" fill="white"/>
  
  <!-- Human Figure (Dark Blue) -->
  <g fill="#1e3a8a">
    <!-- Head -->
    <circle cx="32" cy="22" r="5"/>
    <!-- Body -->
    <rect x="29" y="27" width="6" height="14" rx="2"/>
    <!-- Arms - raised and open -->
    <path d="M 29 30 Q 22 25 20 20 Q 18 15 20 10 Q 22 5 29 10" stroke="#1e3a8a" stroke-width="2.5" fill="none"/>
    <path d="M 35 30 Q 42 25 44 20 Q 46 15 44 10 Q 42 5 35 10" stroke="#1e3a8a" stroke-width="2.5" fill="none"/>
  </g>
  
  <!-- Tree Canopy (Dark Green) - More organic and interconnected -->
  <g fill="#166534">
    <!-- Main central arch -->
    <path d="M 12 18 Q 32 8 52 18 Q 56 26 52 34 Q 32 44 12 34 Q 8 26 12 18 Z"/>
    
    <!-- Left smaller arch - connected to human -->
    <path d="M 20 22 Q 28 18 32 22 Q 28 26 20 22 Z"/>
    
    <!-- Right smaller arch - connected to human -->
    <path d="M 32 22 Q 36 18 44 22 Q 40 26 32 22 Z"/>
    
    <!-- Additional organic elements -->
    <path d="M 16 24 Q 24 20 28 24 Q 24 28 16 24 Z" opacity="0.8"/>
    <path d="M 36 24 Q 44 20 48 24 Q 44 28 36 24 Z" opacity="0.8"/>
  </g>
  
  <!-- Subtle connection lines between human and tree -->
  <g stroke="#1e3a8a" stroke-width="1" opacity="0.3">
    <line x1="29" y1="30" x2="20" y2="22"/>
    <line x1="35" y1="30" x2="44" y2="22"/>
  </g>
</svg>`;

// Conteúdo do favicon.ico (placeholder)
const icoContent = `<!-- Favicon ICO placeholder -->
<!-- O navegador usará o favicon.svg quando disponível -->
<!-- Para gerar um ICO real, use ferramentas online como favicon.io -->`;

// Caminhos dos arquivos
const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'favicon.svg');
const icoPath = path.join(publicDir, 'favicon.ico');

try {
    // Criar diretório public se não existir
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Escrever favicon.svg
    fs.writeFileSync(svgPath, svgContent);
    console.log('✅ favicon.svg criado com sucesso!');
    
    // Escrever favicon.ico
    fs.writeFileSync(icoPath, icoContent);
    console.log('✅ favicon.ico criado com sucesso!');
    
    console.log('\n🎯 Favicon implementado com sucesso!');
    console.log('📁 Arquivos criados:');
    console.log(`   - ${svgPath}`);
    console.log(`   - ${icoPath}`);
    console.log('\n💡 Para gerar um favicon.ico real:');
    console.log('   1. Acesse https://favicon.io/');
    console.log('   2. Faça upload do favicon.svg');
    console.log('   3. Baixe o arquivo .ico gerado');
    console.log('   4. Substitua o arquivo public/favicon.ico');
    
} catch (error) {
    console.error('❌ Erro ao gerar favicon:', error.message);
}
