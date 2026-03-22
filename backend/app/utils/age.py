from datetime import date


def format_age_display(date_of_birth, age_years=None):
    """Return a human-readable age string (e.g. '2 months, 5 days').

    If date_of_birth is available, computes years/months/days precisely.
    Otherwise falls back to the stored integer age (years only).
    """
    if date_of_birth:
        today = date.today()
        if date_of_birth > today:
            return None

        years = today.year - date_of_birth.year
        months = today.month - date_of_birth.month
        days = today.day - date_of_birth.day

        if days < 0:
            months -= 1
            # days in previous month
            prev_month = date(today.year, today.month, 1)
            from calendar import monthrange
            _, prev_days = monthrange(
                prev_month.year if today.month > 1 else today.year - 1,
                today.month - 1 if today.month > 1 else 12,
            )
            days += prev_days

        if months < 0:
            years -= 1
            months += 12

        parts = []
        if years > 0:
            parts.append(f"{years}y")
        if months > 0:
            parts.append(f"{months}m")
        if days > 0 or not parts:
            parts.append(f"{days}d")

        return " ".join(parts)

    if age_years is not None:
        return f"{age_years}y"

    return None
