const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

const oldBannerRegex = /{\/\* Telegram Bot Banner \*\/}[\s\S]*?View Setup Guide\s*<\/a>\s*<\/div>\s*<\/div>\s*<\/div>/;

const newCompactCard = `          {/* Telegram Bot Setup */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
              <LucideBot className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-zinc-900">Telegram Bot</h2>
            </div>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-3 text-blue-600">
                <LucideBot className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-zinc-900 mb-1">Automated SMS Bot</h3>
              <p className="text-xs text-zinc-500 mb-5">Buy numbers and get SMS codes instantly inside Telegram.</p>
              <a 
                href="/dashboard/telegram" 
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm"
              >
                View Setup Guide
              </a>
            </div>
          </div>`;

if (oldBannerRegex.test(code)) {
    code = code.replace(oldBannerRegex, newCompactCard);
    fs.writeFileSync('src/app/dashboard/settings/page.tsx', code, 'utf8');
    console.log('Fixed banner layout!');
} else {
    console.log('Could not find the old banner.');
}
