import os

file_path = "src/app/dashboard/telegram/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

commands_block = """          {/* Available Commands */}
          <div className="mt-6">
            <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <LucideTerminal className="w-4 h-4 text-zinc-400" />
              Bot Commands Reference
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { cmd: '/buy', desc: 'Purchase number' },
                { cmd: '/deposit', desc: 'Top-up wallet' },
                { cmd: '/active', desc: 'View active OTPs' },
                { cmd: '/status', desc: 'Account stats' },
                { cmd: '/balance', desc: 'Check balance' },
                { cmd: '/unlink', desc: 'Disconnect bot' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-zinc-200 bg-white shadow-sm hover:border-blue-200 transition-colors">
                  <code className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {item.cmd}
                  </code>
                  <span className="text-xs text-zinc-600 font-medium">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>"""

# Remove from left side
if commands_block in code:
    code = code.replace(commands_block, "")
    
    # Insert into right side below the Connection Status box
    # The right side div ends with:
    #                 </button>
    #               </form>
    #             )}
    #           </div>
    #         </div>
    
    # I will find the exact ending of the right side Connection Status box.
    anchor = "            </div>\n          </div>"
    
    # We want to put it exactly after the Connection Status block inside the right column.
    # Currently:
    # {/* Right Side: The Form */}
    # <div>
    #   <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden sticky top-8">
    #     ...
    #   </div>
    #   {/* INJECT HERE */}
    # </div>
    
    search_target = "            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}"
    if search_target in code:
        replacement = "            </div>\n          </div>\n\n" + commands_block + "\n\n        </div>\n      </div>\n    </div>\n  );\n}"
        code = code.replace(search_target, replacement)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(code)
        print("Successfully moved Commands to the right column!")
    else:
        print("Could not find the end of the file/right column.")
else:
    print("Could not find commands block.")
