/* ============================================================
   LOCATION UTILITIES
============================================================ */

const EARTH_RADIUS_KM = 6371;


/* ============================================================
   HAVERSINE DISTANCE
============================================================ */

function calculateDistanceKm(
    latitude1,
    longitude1,
    latitude2,
    longitude2
) {

    const lat1 =
        Number(latitude1);

    const lon1 =
        Number(longitude1);

    const lat2 =
        Number(latitude2);

    const lon2 =
        Number(longitude2);


    if (
        !Number.isFinite(lat1) ||
        !Number.isFinite(lon1) ||
        !Number.isFinite(lat2) ||
        !Number.isFinite(lon2)
    ) {

        throw new Error(
            "Invalid latitude or longitude"
        );

    }


    const toRadians =
        degrees =>
            degrees *
            (Math.PI / 180);


    const dLat =
        toRadians(
            lat2 - lat1
        );

    const dLon =
        toRadians(
            lon2 - lon1
        );


    const a =
        Math.sin(dLat / 2) ** 2 +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(dLon / 2) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return (
        EARTH_RADIUS_KM *
        c
    );

}


/* ============================================================
   LOCATION VALIDATION
============================================================ */

function isWithinRadius(
    latitude1,
    longitude1,
    latitude2,
    longitude2,
    radiusMeters = 100
) {

    const distanceKm =
        calculateDistanceKm(
            latitude1,
            longitude1,
            latitude2,
            longitude2
        );


    return {

        withinRadius:
            distanceKm * 1000 <=
            radiusMeters,

        distanceKm,

        distanceMeters:
            distanceKm * 1000

    };

}


module.exports = {

    calculateDistanceKm,

    isWithinRadius

};