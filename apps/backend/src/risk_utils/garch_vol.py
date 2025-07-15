import sys
import json
import numpy as np
from arch import arch_model

def main():
    # Read price list from stdin as JSON
    prices = json.loads(sys.stdin.read())
    returns = np.diff(np.log(prices))

    # Fit GARCH(1,1)
    model = arch_model(returns, vol='Garch', p=1, q=1)
    res = model.fit(disp='off')
    forecast = res.forecast(horizon=1)
    predicted_var = forecast.variance.values[-1, 0]
    predicted_vol = np.sqrt(predicted_var)

    print(json.dumps({"volatility": float(predicted_vol)}))

if __name__ == "__main__":
    main()
