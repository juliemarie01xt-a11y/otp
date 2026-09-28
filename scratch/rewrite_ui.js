const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/buy/page.tsx', 'utf8');

const startMarker = 'Select Service Card';
const endMarker = '</main>';

let startIdx = content.indexOf(startMarker);
if (startIdx === -1) { console.log('Start not found'); process.exit(1); }

startIdx = content.lastIndexOf('{/*', startIdx);

const endIdx = content.indexOf(endMarker, startIdx);
if (endIdx === -1) { console.log('End not found'); process.exit(1); }

const newUI = {\/* Select Service Wizard *\/}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {\/* Header *\/}
          <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
            <h2 className="font-bold text-zinc-900 flex items-center gap-2">
              {step === 1 && "1. Select Service"}
              {step === 2 && "2. Select Country"}
              {step === 3 && "3. Choose Route"}
            </h2>
            {step > 1 && (
              <button 
                onClick={() => {
                  if (step === 3) setStep(2);
                  if (step === 2) setStep(1);
                  setAvailability(null);
                  setError('');
                }}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                ← Back
              </button>
            )}
          </div>

          <div className="p-5">
            {\/* STEP 1: Services *\/}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {POPULAR_SERVICES.map(s => (
                  <button
                    key={s.code}
                    onClick={() => { setService(s.code); setStep(2); }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all active:scale-[0.98]"
                  >
                    <img src={s.logo} alt="" className="w-10 h-10 object-contain mb-3" />
                    <span className="text-sm font-bold text-zinc-800">{s.name}</span>
                  </button>
                ))}
              </div>
            )}

            {\/* STEP 2: Countries *\/}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {POPULAR_COUNTRIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { 
                      setCountry(c.id); 
                      setStep(3); 
                      setTimeout(() => checkAvailability(c.id, service), 50); 
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all active:scale-[0.98]"
                  >
                    <img src={c.flagUrl} alt="" className="w-8 h-6 rounded-[2px] object-cover mb-2 shadow-sm" />
                    <span className="text-sm font-bold text-zinc-800 text-center">{c.name}</span>
                  </button>
                ))}
              </div>
            )}

            {\/* STEP 3: Routes & Pricing *\/}
            {step === 3 && (
              <div className="space-y-4">
                {\/* Selection Summary *\/}
                <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <img src={selectedService.logo} alt="" className="w-6 h-6 object-contain" />
                  <span className="text-sm font-bold text-zinc-300">+</span >
                  <img src={selectedCountry.flagUrl} alt="" className="w-6 h-4 rounded-[2px] object-cover" />
                  <div className="ml-auto text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    {selectedService.name} • {selectedCountry.short}
                  </div>
                </div>

                {loading && (
                  <div className="py-12 flex flex-col items-center justify-center text-zinc-400">
                    <LucideLoader2 className="w-8 h-8 animate-spin mb-3 text-zinc-300" />
                    <span className="text-sm font-medium">Finding best routes...</span>
                  </div>
                )}

                {error && !loading && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 text-sm font-medium border border-red-100">
                    <LucideXCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {availability && !error && !loading && (
                  <div className="space-y-3 mt-4">
                    {availability.options.map((opt) => (
                      <div 
                        key={opt.tier} 
                        className={\ounded-xl p-4 flex items-center justify-between gap-4 border transition-colors \\}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={\ont-bold text-sm \\}>
                              {opt.tier === 'premium' ? 'High-Priority' : 'Standard'}
                            </span>
                            {opt.tier === 'premium' && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded">
                                Faster
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            {opt.tier === 'premium'
                              ? 'Historically faster delivery. Success depends on network.'
                              : 'Success rates vary. Cancel and retry if SMS fails.'}
                          </p>
                        </div>
                        <button
                          onClick={() => buyNumber(opt.tier, opt.price)}
                          disabled={loading}
                          className={\shrink-0 px-4 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-50 \\}
                        >
                          {purchasingTier === opt.tier ? (
                            <LucideLoader2 className="w-4 h-4 animate-spin mx-auto" />
                          ) : (
                            '$' + Number(opt.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      ;

const newContent = content.substring(0, startIdx) + newUI + content.substring(endIdx);
fs.writeFileSync('src/app/dashboard/buy/page.tsx', newContent);
console.log('UI Replaced with Node');
