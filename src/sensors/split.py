# Leave-one-site-out and same-site (debug) splits. The one hard rule: the test
# EPA site is never in train. check_no_leak is what tests/test_eval.py injects
# a leak into, so a leak must raise.

def check_no_leak(train, test_id):
    if test_id in set(train["epa_site"]):
        raise ValueError(f"leak: test site {test_id!r} present in train")


def loso_split(pairs, test_id):
    """Reported split: train on every other EPA site, test on the held-out one."""
    train = pairs[pairs["epa_site"] != test_id]
    test = pairs[pairs["epa_site"] == test_id]
    check_no_leak(train, test_id)
    return train, test


def same_site_split(pairs, test_id):
    """Debug split: fit and score on the held-out site. Illegal for the headline."""
    site = pairs[pairs["epa_site"] == test_id]
    return site, site
