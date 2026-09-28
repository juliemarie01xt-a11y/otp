with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_block = """    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (polling && (activation.activationId || activation.id)) {
        interval = setInterval(async () => {
          try {
            const res = await axios.get('/api/vsim/status', {
              params: { id: activation.activationId || activation.id }
            });
            if (res.data.status === 'COMPLETED') {
              setOtpCode(res.data.code);
              setPolling(false);
            } else if (res.data.status === 'CANCELLED') {
              setError('Activation was cancelled.');
              setPolling(false);
              if (user?.id) fetchWallet(user.id);
              setTimeout(() => onCancel(activation.activationId || activation.id), 3000);
            }
          } catch (err) {}
        }, 3000);
      }
      return () => clearInterval(interval);
    }, [polling, activation, user?.id]);"""

new_block = """    useEffect(() => {
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

code = code.replace(old_block, new_block)

with open('src/app/dashboard/buy/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("done")
