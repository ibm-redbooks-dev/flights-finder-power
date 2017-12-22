'use strict';

module.exports = {
    SECRET: (process.env.SECRET||''),

    geocoderOptions : {
      'provider': 'google',
      'httpAdapter': 'https', // Default
      'apiKey': (process.env.GOOGLE_MAP_API_KEY||'<put-your-credentials-here>'), // for Mapquest, OpenCage, Google Premier
      'formatter': null // 'gpx', 'string', ...
    },

    langUnderstandingOptions: {
        'username': (process.env.WATSON_LANG_USER_ID||''),
        'password': (process.env.WATSON_LANG_USER_PWD||''),
        'version_date': (process.env.WATSON_LANG_VERSION_DATE||''),
    },

    discoveryOptions: {
        'username': (process.env.WATSON_DISC_USER_ID||''),
        'password': (process.env.WATSON_DISC_USER_PWD||''),
        'version': (process.env.WATSON_DISC_VERSION||'v1'),
        'version_date': (process.env.WATSON_DISC_VERSION_DATE||''),
    },

    findFlightService: (process.env.FIND_FLIGHT_URL||'http://common1.idevcloud.com:10076/web/services/findflight'),

    bluemixWeather: {
        'username': (process.env.BLUEMIX_WEATHER_USER_ID||''),
        'password': (process.env.BLUEMIX_WEATHER_USER_PWD||''),
        'url': (process.env.BLUEMIX_WEATHER_URL||'https://twcservice.mybluemix.net/api/weather')
    }
}
