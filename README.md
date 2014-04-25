scatter-plots
=============

A web app to show scatter plots with Google Charts API.

## Bulid the web app

Edit the file `dataSourceUrl.js` to make `dataSourceUrl` have the correct url to the json format of your Google Sheets. The url is usually in the following format

    http://spreadsheets.google.com/tq?key=<key>&range=<range>&gid=<gid>

Note that:
- The first row of your sheet should be the header.
- The first column of your sheet should be the labels of the rows.
- The new Google sheets have not yet support json output.

Once you have this line edited, simply open `index.html` in your non-IE browser.


## While you are browsing

Use arrow keys to flip through different scatter plots. On the right panel there are various options, which are most self-explanatory.

Clicking on the dots on the plot will mark them red. Clilking on them again to bring them back to blue.

You can copy the `key` and send it to other people. The key can bring the scatter plot to a specfic state. 



