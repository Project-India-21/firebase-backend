node_modules/const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp({
    databaseURL: "https://project-21-3c016-default-rtdb.firebaseio.com/",
});

exports.enterHospital = functions.https._onCallWithOptions(
    async (data, context) => {
        if(data && data.hospital !== null){
            var status = await admin.database().ref('Hospital').push().set(data.hospital);
            return {
                status: "SUCCESS",
            };
        }else{
            return {
                status: "INVALID_PARAMS",
            };
        }
    }, {
        memory: "256MB",
    }
);

// state, lat, lon NEEDED
exports.getNearbyHospitals = functions.https._onCallWithOptions(
    async (data, context) => {
        if(data && data.state !== null && data.lat !== null && data.lon !== null){
            var hospitals = await admin.database().ref('Hospital').get();
            if(hospitals.exists()){
                let HospitalList = [];
                hospitals.forEach((snap) => {
                    if(snap.child('state').val() === data.state)
                        HospitalList.push(
                            {
                                id: snap.key,
                                dist: getDist(snap.child('lat').val(), snap.child('lon').val(), data.lat, data.lon),
                            }
                        );
                });
                
                // sorting list of hospitals according to data
                HospitalList.sort(
                    (a, b) => a.dist - b.dist
                );

                // sending only first n hospitals from the list,
                // taking count to send from param else if that not present then default 5
                let countToSend = data.count !== null ? data.count : 5;

                HospitalList = HospitalList.slice(0, Math.min(HospitalList.length, countToSend));

                // now putting in data
                let finalArrayToReturn = HospitalList.map(
                    (val) => {
                        return hospitals.child(val.id).val();
                    }
                );

                return {
                    hospitals: finalArrayToReturn,
                };
            }else{
                return {
                    hospitals: [],
                };
            }
        }else{
            return {
                status: "INVALID_PARAMS",
            };
        }
    }, {
        memory: "512MB",
    }
);

function getDist(lat1, lon1, lat2, lon2) {
    var R = 6371; // in km
    var dLat = toRad(lat2-lat1);
    var dLon = toRad(lon2-lon1);
    lat1 = toRad(lat1);
    lat2 = toRad(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
}

function toRad(Value) 
{
    return Value * Math.PI / 180;
}



