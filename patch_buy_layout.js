const fs = require('fs');

let code = fs.readFileSync('src/app/dashboard/buy/page.tsx', 'utf8');

// Replace the step state to only have 1 and 2, and add search states
code = code.replace(
  /const \[step, setStep\] = useState<.*?\(1\);/,
  `const [step, setStep] = useState(1);
  const [countrySearch, setCountrySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');`
);

const startIdx = code.indexOf('{/* Main Buy Wizard */}');
const endIdx = code.indexOf('{/* Active Number Cards Section */}');

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers');
  process.exit(1);
}

const replacement = `{/* Main Buy Wizard */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        
        {/* Left Column: Countries */}
        <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden h-[600px]">
          <div className="p-3 border-b border-zinc-800">
            <input 
              type="text" 
              placeholder="Search for a Country..." 
              className="w-full bg-zinc-950/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {POPULAR_COUNTRIES
              .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
              .map(c => (
              <button
                key={c.id}
                onClick={() => { setCountry(c.id); setStep(1); setAvailability(null); setError(''); }}
                className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors \${
                  country === c.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-zinc-300 hover:bg-zinc-800/50'
                }\`}
              >
                <img src={c.flagUrl} alt="" className="w-6 h-4 rounded-[2px] object-cover" />
                <span className="text-sm font-medium">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Services or Routes */}
        <div className="flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden h-[600px]">
          
          {step === 1 && (
            <>
              <div className="p-3 border-b border-zinc-800">
                <input 
                  type="text" 
                  placeholder="Search for an App..." 
                  className="w-full bg-zinc-950/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {routesLoading ? (
                  <div className="text-center py-8 text-zinc-500">Loading services...</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {POPULAR_SERVICES
                      .filter(s => s.code !== 'gmail' && s.name.toLowerCase().includes(serviceSearch.toLowerCase()) && availableRoutes.some(r => r.internal_service === s.code && r.country_id === country))
                      .map(s => {
                        const sRoutes = availableRoutes.filter(r => r.internal_service === s.code && r.country_id === country);
                        const minPrice = sRoutes.length > 0 ? Math.min(...sRoutes.map(r => r.cached_wholesale_cost + 0.012)).toFixed(2) : '--';
                        return (
                          <button
                            key={s.code}
                            onClick={() => { 
                              setService(s.code); 
                              setStep(2); 
                              setTimeout(() => checkAvailability(country, s.code), 50); 
                            }}
                            className="flex items-center justify-between p-3 rounded-lg border border-zinc-700 bg-zinc-800/30 hover:border-blue-500/50 hover:bg-zinc-800/80 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <img src={s.logo} alt="" className="w-8 h-8 object-contain" />
                              <span className="text-sm font-medium text-zinc-200">{s.name}</span>
                            </div>
                            <span className="text-xs font-mono text-zinc-400">From \${minPrice}</span>
                          </button>
                        );
                      })
                    }
                    {POPULAR_SERVICES.filter(s => s.code !== 'gmail' && s.name.toLowerCase().includes(serviceSearch.toLowerCase()) && availableRoutes.some(r => r.internal_service === s.code && r.country_id === country)).length === 0 && (
                      <div className="col-span-full text-center py-8 text-zinc-500 text-sm">
                        No available services for the selected country.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-800/30">
                <button 
                  onClick={() => { setStep(1); setAvailability(null); setError(''); }}
                  className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  ← Back to Apps
                </button>
                <div className="flex items-center gap-2">
                  <img src={selectedCountry.flagUrl} alt="" className="w-5 h-3 rounded-[2px] object-cover" />
                  <span className="text-sm font-bold text-white">{selectedCountry.short} + {selectedService.name}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {loading && (
                  <div className="text-center py-8 text-zinc-500 text-sm animate-pulse">Checking route availability and capacity...</div>
                )}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                    {error}
                  </div>
                )}
                {!loading && availability && (
                  <div className="space-y-3">
                    {availability.map((route: any) => (
                      <div key={route.id} className={\`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 \${route.tier === 'premium' ? 'bg-blue-500/5 border-blue-500/30' : 'bg-zinc-800/50 border-zinc-700'}\`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={\`font-bold text-sm \${route.tier === 'premium' ? 'text-blue-400' : 'text-zinc-200'}\`}>
                              {route.tier === 'premium' ? 'Premium Route' : 'Standard Route'}
                            </span>
                            {route.tier === 'premium' && <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Recommended</span>}
                          </div>
                          <p className="text-xs text-zinc-500">
                            {route.tier === 'premium' ? 'Highest delivery rate and fastest OTP arrival. Recommended for fresh accounts.' : 'Standard delivery queue. Good for most generic verification needs.'}
                          </p>
                        </div>
                        <div className="flex items-center sm:flex-col gap-4 sm:gap-1.5">
                          <span className="text-lg font-mono font-bold text-white whitespace-nowrap">\${(route.cost + 0.012).toFixed(2)}</span>
                          <button
                            onClick={() => buyNumber(route)}
                            disabled={!user || (wallet?.balance ?? 0) < (route.cost + 0.012)}
                            className={\`w-full sm:w-auto px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 \${route.tier === 'premium' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}\`}
                          >
                            {!user ? 'Login to Buy' : (wallet?.balance ?? 0) < (route.cost + 0.012) ? 'Top up needed' : 'Buy Now'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {availability.length === 0 && (
                      <div className="text-center py-6 text-zinc-500 text-sm">
                        All routes are currently out of stock for this country/service. Please try another country.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Active Number Cards Section */}`;

const newCode = code.substring(0, startIdx) + replacement + code.substring(endIdx);
fs.writeFileSync('src/app/dashboard/buy/page.tsx', newCode);
console.log('Successfully rewritten the layout to side-by-side');
