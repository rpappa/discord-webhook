export function validateUrl(url: string | undefined) {
    if (!url) return;
    try {
        // convert to string if necessary
        const throwsIfInvalid = new URL(`${url}`);

        return url;
    } catch {}
}

export function validateDateConstructorArg(arg: ConstructorParameters<typeof Date>[0]) {
    // try constructing a date from the argument
    // if it's not a valid date, it will be NaN
    const asDate = new Date(arg);

    if (Number.isNaN(asDate.getTime())) {
        return;
    }

    return asDate;
}
