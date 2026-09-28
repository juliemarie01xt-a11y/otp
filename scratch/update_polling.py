import re

with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_polling = """    useEffect(() => {
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
              setTimeout(() => onCancel(activation.activationId || activation.id), 3000);
            }
          } catch (err) {}
        }, 3000);
      }
      return () => clearInterval(interval);
    }, [polling, activation, user?.id]);"""

new_polling = """    useEffect(() => {
      let timeoutId: NodeJS.Timeout;
      let isSubscribed = true;

      const pollStatus = async () => {
        if (!polling || !isSubscribed) return;

        try {
          const res = await axios.get('/api/vsim/status', {
            params: { id: activation.activationId || activation.id }
          });
          
          if (!isSubscribed) return;

          if (res.data.status === 'COMPLETED') {
            setOtpCode(res.data.code);
            setPolling(false);
            return;
          } else if (res.data.status === 'CANCELLED') {
            setError('Activation was cancelled.');
            setTimeout(() => onCancel(activation.activationId || activation.id), 3000);
            setPolling(false);
            return;
          }
        } catch (err) {}

        if (isSubscribed) {
          // Dynamic Backoff Algorithm to save Vercel costs!
          const createdTime = activation.createdAt ? new Date(activation.createdAt).getTime() : Date.now();
          const elapsedSeconds = (Date.now() - createdTime) / 1000;
          
          let nextDelay = 3000;
          if (elapsedSeconds > 180) { // After 3 minutes
            nextDelay = 8000;
          } else if (elapsedSeconds > 60) { // After 1 minute
            nextDelay = 5000;
          }
          
          timeoutId = setTimeout(pollStatus, nextDelay);
        }
      };

      if (polling && (activation.activationId || activation.id)) {
        pollStatus();
      }

      return () => {
        isSubscribed = false;
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [polling, activation, user?.id]);"""

code = code.replace(old_polling, new_polling)

with open('src/app/dashboard/buy/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("done polling")
