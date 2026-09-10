# OLS on the training sites; Barkjohn applied with no fit.

from sklearn.linear_model import LinearRegression

from . import const


def fit_ols(train, features=const.FEATURES):
    model = LinearRegression()
    model.fit(train[features].to_numpy(), train["epa_pm25"].to_numpy())
    return model


def predict_ols(model, df, features=const.FEATURES):
    return model.predict(df[features].to_numpy())


def barkjohn(df):
    """Published US-wide correction; no parameters learned here."""
    c = const.BARKJOHN
    return c["pa_cf1"] * df["pa_cf1"] + c["rh"] * df["rh"] + c["intercept"]
