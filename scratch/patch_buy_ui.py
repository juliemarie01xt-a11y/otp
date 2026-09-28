with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# 1. Add state for active routes
state_code = """  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await axios.get('/api/routes/available');
        setAvailableRoutes(res.data.routes || []);
      } catch (err) {
        console.error('Failed to load routes');
      } finally {
        setRoutesLoading(false);
      }
    };
    fetchRoutes();
  }, []);"""

code = code.replace("  const [country, setCountry] = useState(POPULAR_COUNTRIES[0].id);", state_code + "\n\n  const [country, setCountry] = useState(POPULAR_COUNTRIES[0].id);")

# 2. Filter services
old_service_map = "{POPULAR_SERVICES.map(s => ("
new_service_map = "{POPULAR_SERVICES.filter(s => availableRoutes.some(r => r.internal_service === s.code)).map(s => ("
code = code.replace(old_service_map, new_service_map)

# 3. Filter countries
old_country_map = "{availableCountries.map(c => ("
new_country_map = "{availableCountries.filter(c => availableRoutes.some(r => r.internal_service === service && r.country_id === c.id)).map(c => ("
code = code.replace(old_country_map, new_country_map)

# 4. Add loading state to step 1
old_step_1 = "{/* STEP 1: Services */}"
new_step_1 = """{/* STEP 1: Services */}
              {routesLoading && (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                  <LucideLoader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-sm">Loading available services...</p>
                </div>
              )}
              {!routesLoading && POPULAR_SERVICES.filter(s => availableRoutes.some(r => r.internal_service === s.code)).length === 0 && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-8 text-center">
                  <p className="text-zinc-500 font-medium mb-1">No Services Available</p>
                  <p className="text-sm text-zinc-400">The admin has not configured any routes yet.</p>
                </div>
              )}"""
code = code.replace(old_step_1, new_step_1)

# 5. Add empty state to step 2 (Countries)
old_step_2_grid = '<div className="grid grid-cols-2 md:grid-cols-3 gap-3">'
new_step_2_grid = """{!routesLoading && availableCountries.filter(c => availableRoutes.some(r => r.internal_service === service && r.country_id === c.id)).length === 0 && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-8 text-center mt-4">
                  <p className="text-zinc-500 font-medium mb-1">No Countries Available</p>
                  <p className="text-sm text-zinc-400">There are no active routes for this service.</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">"""
# We only want to replace the SECOND occurrence of <div className="grid grid-cols-2 md:grid-cols-3 gap-3"> (because the first one is actually grid-cols-2 gap-3 for Services, but let's check)
# Actually, let's just use regex for the step 2 container
code = code.replace('<div className="grid grid-cols-2 md:grid-cols-3 gap-3">\n                  {availableCountries.filter', new_step_2_grid + '\n                  {availableCountries.filter')


# 6. Add flags to the Tiers
old_tier_text = "{opt.tier === 'premium' ? 'High-Priority' : 'Standard'}"
new_tier_text = """<img src={selectedCountry.flagUrl} className="inline-block w-4 h-4 mr-1.5 object-cover rounded shadow-sm border border-black/10" alt="flag" />
                                {opt.tier === 'premium' ? 'High-Priority' : 'Standard'}"""
code = code.replace(old_tier_text, new_tier_text)


with open('src/app/dashboard/buy/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
