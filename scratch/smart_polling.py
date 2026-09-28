with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# Find the exact useEffect block
regex = r"    useEffect\(\(\) => \{\n      let interval: NodeJS\.Timeout;\n      if \(polling && \(activation\.activationId \|\| activation\.id\)\) \{\n        interval = setInterval\(async \(\) => \{\n          try \{\n            const res = await axios\.get\('/api/vsim/status', \{\n              params: \{ id: activation\.activationId \|\| activation\.id \}\n            \}\);\n            if \(res\.data\.status === 'COMPLETED'\) \{\n              setOtpCode\(res\.data\.code\);\n              setPolling\(false\);\n            \} else if \(res\.data\.status === 'CANCELLED'\) \{\n              setError\('Activation was cancelled\.'\);\n              setPolling\(false\);\n              if \(user\?\.id\) fetchWallet\(user\.id\);\n              setTimeout\(\(\) => onCancel\(activation\.activationId \|\| activation\.id\), 3000\);\n            \}\n          \} catch \(err\) \{\}\n        \}, 3000\);\n      \}\n      return \(\) => clearInterval\(interval\);\n    \}, \[polling, activation, user\?\.id\]\);"

new_effect = """    useEffect(() => {
      let timeout: NodeJS.Timeout;
      let isMounted = true;
      
      const pollStatus = async () => {
        if (!polling || !isMounted || !(activation.activationId || activation.id)) return;
        
        try {
          const res = await axios.get('/api/vsim/status', {
            params: { id: activation.activationId || activation.id }
          });
          if (res.data.status === 'COMPLETED') {
            setOtpCode(res.data.code);
            setPolling(false);
            return;
          } else if (res.data.status === 'CANCELLED') {
            setError('Activation was cancelled.');
            setPolling(false);
            if (user?.id) fetchWallet(user.id);
            setTimeout(() => onCancel(activation.activationId || activation.id), 3000);
            return;
          }
        } catch (err) {}
        
        // Smart Polling Logic (Exponential Backoff)
        const createdTime = activation.createdAt ? new Date(activation.createdAt).getTime() : Date.now();
        const elapsedSecs = (Date.now() - createdTime) / 1000;
        
        let nextDelay = 3000; // 0-30s: Poll every 3 seconds
        if (elapsedSecs > 120) {
           nextDelay = 15000; // 2m-15m: Poll every 15 seconds
        } else if (elapsedSecs > 30) {
           nextDelay = 7000;  // 30s-2m: Poll every 7 seconds
        }
        
        if (isMounted && polling) {
          timeout = setTimeout(pollStatus, nextDelay);
        }
      };

      if (polling) {
        pollStatus();
      }

      return () => {
        isMounted = false;
        clearTimeout(timeout);
      };
    }, [polling, activation, user?.id]);"""

if re.search(regex, code):
    code = re.sub(regex, new_effect, code)
    with open('src/app/dashboard/buy/page.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Replaced successfully")
else:
    print("Regex failed")
