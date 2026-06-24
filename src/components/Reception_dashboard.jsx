
import React, { useEffect, useState } from 'react'
import API from "../api";
import socket from "../socket";

function Reception_dashboard() {

  // NAVIGATION
  const [activeTab, setActiveTab] = useState("dashboard");

  // FORM STATES
  const [consultationTime, setConsultationTime] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [currentToken, setCurrentToken] = useState("--");
  const [isEmergency, setIsEmergency] = useState(false);

  // PATIENTS
  const [patients, setPatients] = useState([]);

  // ANALYTICS
  const [avgConsultation, setAvgConsultation] = useState(0);
  const [totalWaitTime, setTotalWaitTime] = useState(0);
  const [servedToday, setServedToday] = useState(0);

  // SETTINGS
  const [clinicName, setClinicName] = useState("");
  const [defaultConsultation, setDefaultConsultation] =
    useState("");

  // FETCH SETTINGS
  const fetchSettings = async () => {

    try {

      const res = await API.get("/settings");

      setClinicName(
        res.data.settings.clinicName
      );

      setDefaultConsultation(
        res.data.settings.averageConsultationTime
      );

    } catch (error) {

      console.log(error);

    }

  };

  // FETCH PATIENTS
  const fetchPatients = async () => {

    try {

      const res = await API.get("/patient/all");

      const allPatients = res.data.patients;

      setPatients(allPatients);

      // CURRENT SERVING
      const servingPatient = allPatients.find(
        (patient) => patient.status === "serving"
      );

      if (servingPatient) {
        setCurrentToken(servingPatient.tokenNumber);
      } else {
        setCurrentToken("--");
      }

      // WAITING PATIENTS
      const waitingPatients = allPatients.filter(
        (patient) => patient.status === "waiting"
      );

      // AVG CONSULTATION
      if (waitingPatients.length > 0) {

        const totalConsultation = waitingPatients.reduce(
          (acc, patient) =>
            acc + Number(patient.consultationTime || 0),
          0
        );

        const avg = Math.round(
          totalConsultation / waitingPatients.length
        );

        setAvgConsultation(avg);

        setTotalWaitTime(totalConsultation);

      } else {

        setAvgConsultation(0);
        setTotalWaitTime(0);

      }

      // SERVED TODAY
      const donePatients = allPatients.filter(
        (patient) => patient.status === "done"
      );

      setServedToday(donePatients.length);

    } catch (error) {

      console.log(error);

    }

  };

  useEffect(() => {

    fetchPatients();
    fetchSettings();

    socket.on("queueUpdated", () => {
      fetchPatients();
    });

    return () => {
      socket.off("queueUpdated");
    };

  }, []);

  // ADD PATIENT
  const handleAddPatient = async () => {

    if (
      !name ||
      !age ||
      !phone ||
      !consultationTime
    ) {
      alert("Please fill all fields");
      return;
    }

    try {

      await API.post("/patient/add", {
        name,
        age,
        phone,
        consultationTime,
        isEmergency,
      });

      setName("");
      setAge("");
      setPhone("");
      setConsultationTime("");
      setIsEmergency(false);

      fetchPatients();

    } catch (error) {

      console.log(error);

    }

  };

  // CALL NEXT
  const handleCallNext = async () => {

    try {

      const res = await API.post("/patient/next");

      if (res.data.currentPatient) {

        setCurrentToken(
          res.data.currentPatient.tokenNumber
        );

      }

      fetchPatients();

    } catch (error) {

      console.log(error);

    }

  };

  // CLEAR COMPLETED
  const handleClearCompleted = async () => {

    try {

      await API.delete(
        "/patient/clear-completed"
      );

      fetchPatients();

    } catch (error) {

      console.log(error);

    }

  };

  // SAVE SETTINGS
  const handleSaveSettings = async () => {

    try {

      await API.put("/settings", {
        clinicName,
        averageConsultationTime:
          defaultConsultation,
      });

      alert("Settings Saved");

    } catch (error) {

      console.log(error);

    }

  };

  return (

    <div className='w-full font-mono min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 via-yellow-50 to-sky-100'>

      {/* SIDEBAR */}
      <div className='w-full md:w-[18%] min-h-auto md:min-h-screen pt-8  pb-5 
      bg-gradient-to-b from-sky-300 to-yellow-200 shadow-xl'>

        <h1 className='text-4xl font-stretch text-center md:text-[3rem] font-extrabold text-slate-800'>
          {clinicName || "SyncX"}
        </h1>

        <div className='flex flex-row md:flex-col gap-5 mt-10 md:mt-20'>

          <div
            onClick={() => setActiveTab("dashboard")}
            className='text-lg border-2 p-2 m-3 md:text-2xl hover:cursor-pointer font-bold 
            text-slate-700 hover:scale-110 text-center rounded-2xl  hover:text-black transition-all duration-200'>
            Dashboard
          </div>

          <div
            onClick={() => setActiveTab("patients")}
            className='text-lg md:text-2xl hover:cursor-pointer font-bold 
            text-slate-700 hover:scale-110 p-2 m-3 border-2 rounded-2xl text-center hover:text-black transition-all duration-200'>
            Patients
          </div>

          <div
            onClick={() => setActiveTab("settings")}
            className='text-lg md:text-2xl hover:cursor-pointer font-bold 
            text-slate-700 hover:scale-110 p-2 m-3 border-2 rounded-2xl  text-center hover:text-black transition-all duration-200'>
            Settings
          </div>

        </div>

      </div>

      {/* MAIN */}
      <div className='flex-1 pt-8'>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (

          <>

            {/* CARDS */}
            <div className='flex flex-col lg:flex-row gap-5 mx-5 md:mx-10'>

              <div className='h-30 flex-1 pt-5 px-5 rounded-3xl 
              bg-white/40 backdrop-blur-lg border border-white/30 shadow-lg'>

                <h1 className='text-slate-600 font-medium'>
                  Avg Consultancy Time
                </h1>

                <h1 className='font-bold lg:text-3xl p-2 text-slate-800 mt-2'>
                  {avgConsultation} Mins
                </h1>

              </div>

              <div className='h-30 flex-1 pt-5 px-5 rounded-3xl 
              bg-white/40 backdrop-blur-lg border border-white/30 shadow-lg'>

                <h1 className='text-slate-600 font-medium'>
                  Est. Total Wait Time
                </h1>

                <h1 className='font-bold lg:text-3xl p-2 text-slate-800 mt-2'>
                  {totalWaitTime} Mins
                </h1>

              </div>

              <div className='h-30 flex-1 pt-5 px-5 rounded-3xl 
              bg-white/40 backdrop-blur-lg border border-white/30 shadow-lg'>

                <h1 className='text-slate-600 font-medium'>
                  Total Served Today
                </h1>

                <h1 className='font-bold lg:text-3xl text-slate-800 p-2 mt-2'>
                  {servedToday} Patients
                </h1>

              </div>

            </div>

            {/* MIDDLE */}
            <div className='flex flex-col xl:flex-row gap-8 mx-5 md:mx-10 mt-6'>

              {/* ADD PATIENT */}
              <div className='w-full xl:w-[65%] rounded-[2rem] px-5 md:px-10 py-6 
              bg-white/40 backdrop-blur-lg border border-white/30 shadow-xl'>

                <h1 className='text-2xl font-extrabold pb-6 text-slate-800'>
                  Add Patient
                </h1>

                <input
                  type="text"
                  placeholder='Enter patient name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='w-full h-12 pl-4 rounded-2xl outline-none 
                  bg-white/60 border border-slate-200'
                />

                <input
                  type="text"
                  placeholder='Enter phone number'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className='w-full h-12 pl-4 mt-4 rounded-2xl outline-none 
                  bg-white/60 border border-slate-200'
                />

                <div className='flex flex-col md:flex-row gap-3 mt-5'>

                  <input
                    type="text"
                    placeholder='Enter age'
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className='w-full md:w-1/2 h-12 pl-4 rounded-2xl outline-none 
                    bg-white/60 border border-slate-200'
                  />

                  <input
                    type="text"
                    placeholder='Consultation time'
                    value={consultationTime}
                    onChange={(e) =>
                      setConsultationTime(e.target.value)
                    }
                    className='w-full md:w-1/2 h-12 pl-4 rounded-2xl outline-none 
                    bg-white/60 border border-slate-200'
                  />

                </div>

                <div className="flex items-center gap-3 mt-5">

                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) =>
                      setIsEmergency(e.target.checked)
                    }
                  />

                  <label className="font-semibold text-slate-700">
                    Emergency Case
                  </label>

                </div>

                <button
                  onClick={handleAddPatient}
                  className='w-full h-12 rounded-2xl mt-6 font-bold text-slate-800
                  bg-gradient-to-r from-sky-300 to-yellow-200'>

                  Add Patient

                </button>

              </div>

              {/* CURRENT TOKEN */}
              <div className='w-full xl:w-[29%] rounded-[2rem] px-5 py-6
              bg-gradient-to-br from-sky-300 to-yellow-200
              shadow-2xl flex flex-col justify-center'>

                <h1 className='text-center font-bold text-slate-700 text-xl tracking-wide'>
                  CURRENT TOKEN
                </h1>

                <h1 className='text-[5rem] md:text-[7rem] xl:text-[8rem]
                font-extrabold text-center text-slate-800 leading-none'>

                  {currentToken}

                </h1>

              </div>

            </div>

            {/* QUEUE CONTROL */}
            <div className='w-[90%] md:w-[93%] rounded-[2rem] mx-5 md:ml-10 mt-8
            bg-white/40 backdrop-blur-lg border border-white/30 shadow-xl p-6'>

              <h1 className='text-2xl font-extrabold pb-5 text-slate-800'>
                Queue Control Panel
              </h1>

              <button
                onClick={handleCallNext}
                className='w-full h-14 rounded-2xl font-bold text-lg
                bg-gradient-to-r from-yellow-200 to-sky-300'>

                Call Next Token

              </button>

            </div>

          </>

        )}

        {/* PATIENTS TAB */}
        {activeTab === "patients" && (

          <div className='w-[90%] md:w-[93%] rounded-[2rem] mx-5 md:ml-10 mt-8
          bg-white/40 backdrop-blur-lg border border-white/30 shadow-xl p-6'>

            <div className='flex items-center justify-between mb-6'>

              <h1 className='text-3xl font-extrabold text-slate-800'>
                Live Queue
              </h1>

              <button
                onClick={handleClearCompleted}
                className='px-6 py-3 rounded-2xl font-bold
                bg-red-500 text-white hover:bg-red-600'>

                Clear Completed

              </button>

            </div>

            <div className='overflow-x-auto'>

              <table className='w-full'>

                <thead>

                  <tr className='text-left border-b border-slate-300'>

                    <th className='py-3'>Token</th>
                    <th className='py-3'>Name</th>
                    <th className='py-3'>Status</th>
                    <th className='py-3'>Time</th>
                    <th className='py-3'>Priority</th>

                  </tr>

                </thead>

                <tbody>

                  {patients.length > 0 ? (

                    patients.map((patient) => (

                      <tr
                        key={patient._id}
                        className='border-b border-slate-200'
                      >

                        <td className='py-4 font-bold'>
                          {patient.tokenNumber}
                        </td>

                        <td className='py-4'>
                          {patient.name}
                        </td>

                        <td className='py-4'>

                          <span className={`px-4 py-1 rounded-full text-sm font-bold
                          ${
                            patient.status === "waiting"
                              ? "bg-yellow-200 text-yellow-800"
                              : patient.status === "serving"
                              ? "bg-green-200 text-green-800"
                              : "bg-slate-200 text-slate-700"
                          }`}>

                            {patient.status}

                          </span>

                        </td>

                        <td className='py-4'>
                          {patient.consultationTime} mins
                        </td>

                        <td className='py-4'>

                          {patient.isEmergency ? (

                            <span className='bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold'>
                              Emergency
                            </span>

                          ) : (

                            <span className='text-slate-500'>
                              Normal
                            </span>

                          )}

                        </td>

                      </tr>

                    ))

                  ) : (

                    <tr>

                      <td
                        colSpan="5"
                        className='text-center py-10 text-slate-500'
                      >

                        No Patients Added

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (

          <div className='w-[90%] md:w-[93%] rounded-[2rem] mx-5 md:ml-10 mt-8
          bg-white/40 backdrop-blur-lg border border-white/30 shadow-xl p-6'>

            <h1 className='text-3xl font-extrabold text-slate-800 mb-8'>
              Clinic Settings
            </h1>

            <div className='mb-6'>

              <label className='block text-slate-700 font-bold mb-2'>
                Clinic Name
              </label>

              <input
                type="text"
                value={clinicName}
                onChange={(e) =>
                  setClinicName(e.target.value)
                }
                className='w-full h-12 pl-4 rounded-2xl outline-none
                bg-white/60 border border-slate-200'
              />

            </div>

            <div className='mb-6'>

              <label className='block text-slate-700 font-bold mb-2'>
                Default Consultation Time
              </label>

              <input
                type="number"
                value={defaultConsultation}
                onChange={(e) =>
                  setDefaultConsultation(e.target.value)
                }
                className='w-full h-12 pl-4 rounded-2xl outline-none
                bg-white/60 border border-slate-200'
              />

            </div>

            <button
              onClick={handleSaveSettings}
              className='w-full h-12 rounded-2xl mt-4 font-bold text-slate-800
              bg-gradient-to-r from-sky-300 to-yellow-200'>

              Save Settings

            </button>

          </div>

        )}

      </div>

    </div>

  )

}

export default Reception_dashboard

