var SMART;

const filter = {
    date: (date, format) => {
    return (new XDate(date)).toString(format)
},
age: (date) => {
    let yearNow = new Date().getYear()
    let monthNow = new Date().getMonth()
    let dateNow = new Date().getDate()

    let yearDob = new Date(date).getYear()
    let monthDob = new Date(date).getMonth()
    let dateDob = new Date(date).getDate()

    let yearAge = yearNow - yearDob
    let monthAge = null
    let dateAge = null

    if (monthNow >= monthDob) monthAge = monthNow - monthDob
    else {
        yearAge--
        monthAge = 12 + monthNow - monthDob
    }

    if (dateNow >= dateDob) dateAge = dateNow - dateDob
    else {
        monthAge--
        dateAge = 31 + dateNow - dateDob
        if (monthAge < 0) {
            monthAge = 11
            yearAge--
        }
    }

    let hours = (new Date().getTime() - new Date(date).getTime()) / 36e5
    if (dateAge > 1) hours = hours/(24 * dateAge)

    if ( (yearAge > 0) && (monthAge > 0) && (dateAge > 0) ) return yearAge + " years " + monthAge + " months"
    else if ( (yearAge > 0) && (monthAge > 0) && (dateAge == 0) ) return yearAge + " years " + monthAge + " months"
    else if ( (yearAge > 0) && (monthAge == 0) && (dateAge > 0) ) return yearAge + " years " + dateAge + " days"
    else if ( (yearAge > 0) && (monthAge == 0) && (dateAge == 0) ) return yearAge + " years"
    else if ( (yearAge == 0) && (monthAge > 0) && (dateAge > 0) ) return monthAge + " months " + dateAge + " days"
    else if ( (yearAge == 0) && (monthAge > 0) && (dateAge == 0) ) return monthAge + " months"
    else if ( (yearAge == 0) && (monthAge == 0) && (dateAge > 1) ) return dateAge + " days"
    else if ( (yearAge == 0) && (monthAge == 0) && (dateAge > 0) ) return hours.toFixed(2) + " hours"
    else return "Could not calculate age"
},
nameGivenFamily: (p) => {
    let isArrayName = p && p.name && p.name[0]
    let personName

    if (isArrayName) {
        personName = p && p.name && p.name[0]
        if (!personName) return null
    } else {
        personName = p && p.name
        if (!personName) return null
    }

    let user
    if (Object.prototype.toString.call(personName.family) === '[object Array]') {
        user = personName.given.join(" ") + " " + personName.family.join(" ")
    } else {
        user = personName.given.join(" ") + " " + personName.family
    }
    if (personName.suffix) {
        user = user + ", " + personName.suffix.join(", ")
    }
    return user
},
}

//This function displays a single patients demographic details
function displayPatient(response){

    var details = response.data // dealing with only the data portion of the response
    var num_names = (details.name.length - 1)
    var name = details.name[num_names].given.join(" ") + " " + details.name[num_names].family

    $('#name').text(name)
    $('#age').text((filter.age(details.birthDate)))
    $('#gender').text(details.gender)
}

//Query to show one patients information
function showPatient(id)
{
    var patient = SMART.api.read({type: "Patient",id: id}).then(function(details){
        displayPatient(details)
    });
}

//This function displays all the patients in the database in a table
function displayPatients(patients)
{

    for(i = 0; i < patients.length; i++)
    {
        num_names = (patients[i].name.length - 1)
        name = patients[i].name[num_names].given.join(" ") + " " + patients[i].name[num_names].family
        gender = patients[i].gender
        age = (filter.age(patients[i].birthDate))
        $("#patientsTable > tbody").append("<tr><td>"+name+"</td><td>"+age+"</td><td>"+gender+"</td>" +
            "<td style='text-align: center'><button class= 'btn btn-primary' style='width:70%;' onmousedown='showPatient("+ patients[i].id +")'>View</button></td></tr>");
    }
}

//Execution begins here
FHIR.oauth2.ready((fhirClient) => {
    SMART = fhirClient;
   fhirClient.api.fetchAll({ type: "Patient" }).then(function(patients) {
        displayPatients(patients)

    });
})
