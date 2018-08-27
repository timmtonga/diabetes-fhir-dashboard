# FHIR Dashboard for Diabetes Patients

This application was developed as a practical learning example for the Spring 2018 : The Architecture of Interoperability course at the Department of Biomedical Informatics, University of Pittsburgh. It works with a synthetic patient database hosted on a FHIR server on the HSPC Sandbox.

###   How to set up application

  To set up the application on you machine, You first need to install nodejs and npm. A tutorial on how to install these prerequisites can be found here: https://www.taniarascia.com/how-to-install-and-use-node-js-and-npm-mac-and-windows/

  Once you have installed the prerequisites, get a copy of the application source code from github. This can be achieved by running the following command from your terminal if you have git installed:

         git clone https://github.com/timmtonga/diabetes-fhir-dashboard.git

  Alternatively, you can download the application as a compressed Zip folder using this link:  https://github.com/timmtonga/diabetes-fhir-dashboard/archive/master.zip

  Now that you have the application on your computer, the following steps will help you configure the environment to run the application.

  1. Navigate to the folder with the application source code.

  2. Install all the required packages/dependencies: npm install

  3. Start the application : npm start

If all these steps have be run successfully, you should now have a fully functional instance of application. By default it runs on port 8000 on the localhost and can be accessed in the web browser using the link : http://localhost:8000. To access test patient data, you can sign in to the HSPC sandbox and request access to our sandbox provided by the following link https://sandbox.hspconsortium.org/dmDBMI

