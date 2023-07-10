export function createSlug(str: string): string {
    // Replace & with 'and'
    let retVal = str.toLowerCase().replace(/&/g, 'and').trim();
    // Replace / with space
    retVal = retVal.replace(/\//g, ' ');
    // Remove all non-alphanumeric characters, replace spaces with dashes, and remove dashes from beginning and end
    retVal = retVal.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    return retVal;
}
