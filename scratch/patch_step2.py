with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_step2 = """              {/* STEP 2: Countries */}
              {step === 2 && (
                <div className="grid grid-cols-2 gap-3">"""

new_step2 = """              {/* STEP 2: Countries */}
              {step === 2 && (
                <>
                {!routesLoading && availableCountries.filter(c => availableRoutes.some(r => r.internal_service === service && r.country_id === c.id)).length === 0 && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-8 text-center mt-4">
                    <p className="text-zinc-500 font-medium mb-1">No Countries Available</p>
                    <p className="text-sm text-zinc-400">There are no active routes configured for this service.</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">"""

code = code.replace(old_step2, new_step2)

# Also fix the closing tag for step 2 if we opened a fragment <>. We need to close it.
# Actually, wait, `step === 2 && (` opens it. If I add `<>`, I need to close `</>` before the `)}`.
old_step2_close = """                    </button>
                  ))}
                </div>
              )}"""

new_step2_close = """                    </button>
                  ))}
                </div>
                </>
              )}"""

code = code.replace(old_step2_close, new_step2_close)

with open('src/app/dashboard/buy/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
