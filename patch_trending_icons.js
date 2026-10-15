const fs = require('fs');

let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Replace the array definition to remove the hardcoded emojis
code = code.replace(
  /\{\s*id:\s*'wa',[\s\S]*?\].map\(service => \(/,
  `{ id: 'wa', name: 'WhatsApp', price: trendingPrices.wa },
              { id: 'gv', name: 'Google Voice', price: trendingPrices.gv },
              { id: 'tg', name: 'Telegram', price: trendingPrices.tg },
              { id: 'go', name: 'Google/YouTube', price: trendingPrices.go }
            ].map(service => (`
);

// Replace the rendering of the icon to use the getService helper
code = code.replace(
  /<div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xl">\s*\{service\.icon\}\s*<\/div>/,
  `<div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                      <img src={getService(service.id).logo} alt={service.name} className="w-8 h-8 object-contain" />
                    </div>`
);

fs.writeFileSync('src/app/dashboard/page.tsx', code);
console.log('Successfully updated the trending services to use proper image logos.');
