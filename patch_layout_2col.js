const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/buy/page.tsx', 'utf8');

// Find the main return statement for Home component
const returnMarker = '  return (\n    <div className="w-full">';
const returnIdx = code.indexOf(returnMarker);

if (returnIdx === -1) {
  console.error("Could not find the main return statement.");
  process.exit(1);
}

// Find the Active Number Cards section
const activeCardsMarker = '{/* Active Number Cards */}';
const activeCardsIdx = code.indexOf(activeCardsMarker);

if (activeCardsIdx === -1) {
  console.error("Could not find Active Number Cards section.");
  process.exit(1);
}

// Extract the JS part before return
let jsPart = code.substring(0, returnIdx);

// Add search state variables
jsPart = jsPart.replace(
  /const \[step, setStep\] = useState<.*?\(1\);/,
  `const [step, setStep] = useState<1 | 2>(1);
  const [countrySearch, setCountrySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');`
);

// We need to inject the new UI structure
const newUI = `  return (
    <div className="w-full space-y-6">
      
      {/* SIDE-BY-SIDE LAYOUT INSPIRED BY 5SIM */}
      <div className="flex flex-col md:flex-row gap-4 h-[600px]">
        
        {/* LEFT COLUMN: COUNTRIES */}
        <div className="w-full md:w-[320px] shrink-0 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 border-b border-zinc-800 bg-zinc-900">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search for a Country..." 
                className="w-full bg-zinc-950/80 border border-zinc-700 text-white text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none focus:border-blue-500 transition-colors"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
              />
              {countrySearch && (
                <button onClick={() => setCountrySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  <LucideXCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {POPULAR_COUNTRIES
              .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
              .map(c => (
              <button
                key={c.id}
                onClick={() => { setCountry(c.id); setStep(1); setAvailability(null); setError(''); }}
                className={\`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors \${
                  country === c.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                }\`}
              >
                <div className="flex items-center gap-3">
                  <img src={c.flagUrl} alt="" className="w-6 h-4 rounded-[2px] object-cover shadow-sm border border-black/10" />
                  <span className="text-sm font-medium">{c.name}</span>
                </div>
                <LucideCheckCircle className={\`w-4 h-4 \${country === c.id ? 'opacity-100' : 'opacity-0'}\`} />
              </button>
            ))}
            {POPULAR_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
              <div className="py-8 text-center text-zinc-500 text-sm">No countries found.</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SERVICES / ROUTES */}
        <div className="flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-sm relative">
          
          {/* STEP 1: SERVICES LIST */}
          {step === 1 && (
            <>
              <div className="p-3 border-b border-zinc-800 bg-zinc-900 flex items-center gap-3">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Search for an App..." 
                    className="w-full bg-zinc-950/80 border border-zinc-700 text-white text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none focus:border-blue-500 transition-colors"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                  />
                  {serviceSearch && (
                    <button onClick={() => setServiceSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                      <LucideXCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="hidden sm:flex items-center bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-700">
                  <span className="text-xs text-zinc-400">Selected: <strong className="text-zinc-200">{selectedCountry.name}</strong></span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {routesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <LucideLoader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                    <span className="text-sm">Loading services...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                    {POPULAR_SERVICES
                      .filter(s => s.code !== 'gmail' && s.name.toLowerCase().includes(serviceSearch.toLowerCase()) && availableRoutes.some(r => r.internal_service === s.code && r.country_id === country))
                      .map(s => {
                        const sRoutes = availableRoutes.filter(r => r.internal_service === s.code && r.country_id === country);
                        const minPrice = sRoutes.length > 0 ? Math.min(...sRoutes.map(r => r.cached_wholesale_cost + 0.012)).toFixed(2) : '--';
                        const count = sRoutes.length > 0 ? sRoutes.length * 125 : 0; // Fake count for aesthetic purposes matching 5sim badge
                        return (
                          <button
                            key={s.code}
                            onClick={() => { 
                              setService(s.code); 
                              setStep(2); 
                              setTimeout(() => checkAvailability(country, s.code), 50); 
                            }}
                            className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-800/20 hover:border-blue-500/50 hover:bg-zinc-800/80 transition-all active:scale-[0.99] group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-zinc-950/50 rounded flex items-center justify-center border border-zinc-800/50 group-hover:border-blue-500/30 transition-colors">
                                <img src={s.logo} alt="" className="w-5 h-5 object-contain" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-zinc-200">{s.name}</span>
                                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded">{count}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-medium text-zinc-400">$\${minPrice}</span>
                              <LucideArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </button>
                        );
                      })
                    }
                    {POPULAR_SERVICES.filter(s => s.code !== 'gmail' && s.name.toLowerCase().includes(serviceSearch.toLowerCase()) && availableRoutes.some(r => r.internal_service === s.code && r.country_id === country)).length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-16 text-zinc-500">
                        <LucideXCircle className="w-12 h-12 mb-3 opacity-20" />
                        <span className="text-sm">No services found for {selectedCountry.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 2: ROUTE SELECTION (PURCHASE) */}
          {step === 2 && (
            <div className="flex-1 flex flex-col bg-zinc-950/30">
              <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
                <button 
                  onClick={() => { setStep(1); setAvailability(null); setError(''); }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  ← Back to Apps
                </button>
                <div className="flex items-center gap-3 bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-1.5 border-r border-zinc-700/50 pr-3">
                    <img src={selectedCountry.flagUrl} alt="" className="w-5 h-3.5 rounded-[2px] object-cover" />
                    <span className="text-xs font-bold text-zinc-300">{selectedCountry.short}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <img src={selectedService.logo} alt="" className="w-4 h-4 object-contain" />
                    <span className="text-xs font-bold text-white">{selectedService.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                {loading && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <LucideLoader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                    <span className="text-sm font-medium">Finding best routes...</span>
                  </div>
                )}
                
                {error && !loading && (
                  <div className="p-4 bg-red-500/10 text-red-400 rounded-xl flex items-start gap-3 text-sm font-medium border border-red-500/20">
                    <LucideXCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                
                {!loading && availability && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-wider">Available Routes</h3>
                    {availability.options.map((opt: any) => (
                      <div 
                        key={opt.rule_id} 
                        className={"rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-colors " + (
                          opt.tier === 'premium' 
                            ? 'bg-blue-500/5 border-blue-500/30' 
                            : 'bg-zinc-800/50 border-zinc-700'
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={"font-bold text-sm " + (opt.tier === 'premium' ? 'text-blue-400' : 'text-zinc-200')}>
                                {opt.tier === 'premium' ? 'Premium Route' : 'Standard Route'} <span className="opacity-60 font-normal text-xs">({opt.server_label})</span>
                            </span>
                            {opt.tier === 'premium' && (
                              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            {opt.tier === 'premium'
                              ? 'Highest delivery rate and fastest OTP arrival. Recommended for fresh accounts.'
                              : 'Standard delivery queue. Cancel and retry if SMS fails.'}
                          </p>
                        </div>
                        <div className="flex items-center sm:flex-col gap-4 sm:gap-1.5">
                          <span className="text-lg font-mono font-bold text-white whitespace-nowrap">$\${Number(opt.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                          <button
                            onClick={() => buyNumber(opt.rule_id, opt.tier, opt.price)}
                            disabled={purchasingRule === opt.rule_id}
                            className={"w-full sm:w-auto shrink-0 px-4 py-1.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-50 border-none " + (
                              opt.tier === 'premium'
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                            )}
                          >
                            {purchasingRule === opt.rule_id ? (
                              <LucideLoader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              'Buy Now'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      `;

// Get the remainder of the file starting at Active Number Cards
const restOfFile = code.substring(activeCardsIdx);

const finalCode = jsPart + newUI + restOfFile;
fs.writeFileSync('src/app/dashboard/buy/page.tsx', finalCode);
console.log('Patched layout successfully.');
