
import React, { useEffect, useState } from 'react'
import API from "../api";
import socket from "../socket";

function Patient_dashboard() {

  const [patients, setPatients] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [avgTime, setAvgTime] = useState("--");



  // FETCH PATIENTS
  const fetchPatients = async () => {

    try {

      const res = await API.get("/patient/all");

      const allPatients = res.data.patients || [];

      setPatients(allPatients);

      // CURRENT SERVING
      const serving = allPatients.find(
        (patient) => patient.status === "serving"
      );

      setCurrentPatient(serving || null);

      // WAITING PATIENTS
      const waitingPatients = allPatients.filter(
        (patient) => patient.status === "waiting"
      );

      // AVG TIME
      if (waitingPatients.length > 0) {

        const total = waitingPatients.reduce(
          (acc, patient) =>
            acc +
            Number(patient.consultationTime || 0),
          0
        );

        setAvgTime(
          Math.round(
            total / waitingPatients.length
          )
        );

      } else {

        setAvgTime("--");

      }

    } catch (error) {

      console.log(error);

    }

  };



  // SOCKET
  useEffect(() => {

    fetchPatients();

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("queueUpdated", () => {
      fetchPatients();
    });

    return () => {

      socket.off("connect");
      socket.off("disconnect");
      socket.off("queueUpdated");

    };

  }, []);



  // REALTIME TIMER
  useEffect(() => {

    const interval = setInterval(() => {

      setCurrentPatient((prev) => {

        if (!prev) return prev;

        if (prev.remainingTime > 0) {

          return {

            ...prev,
            remainingTime:
              prev.remainingTime - 1,

          };

        }

        return prev;

      });

    }, 60000);

    return () => clearInterval(interval);

  }, []);



  // WAITING PATIENTS
  const upcomingPatients = patients.filter(
    (patient) => patient.status === "waiting"
  );



  return (

    <div className='min-h-screen w-full bg-gradient-to-br from-slate-900 via-sky-950 to-slate-800 flex items-center justify-center px-4 md:px-6 py-4'>

      {/* MAIN CONTAINER */}
      <div className='w-full max-w-7xl flex flex-col'>

        {/* HEADER */}
        <div className='text-center mb-4 md:mb-6'>

          <p className='text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-sky-300 to-yellow-200 bg-clip-text text-transparent'>
            SyncX
          </p>

          {/* CONNECTION */}
          <div className='flex items-center justify-center gap-3 mt-4'>

            <div
              className={`w-4 h-4 rounded-full ${
                connected
                  ? "bg-green-400 shadow-green-400 shadow-lg"
                  : "bg-red-500 shadow-red-500 shadow-lg"
              }`}
            ></div>

            <p className='text-white font-semibold'>

              {connected
                ? "Reception Connected"
                : "Reception Offline"}

            </p>

          </div>

        </div>



        {/* MAIN CONTENT */}
        <div className='flex flex-col xl:flex-row gap-4'>

          {/* LEFT SIDE */}
          <div className='w-full xl:w-[60%] rounded-[2rem]
          bg-white/10 backdrop-blur-xl border border-white/20
          shadow-2xl p-5 md:p-8 flex flex-col justify-center'>

            <h1 className='text-center text-slate-300 text-lg md:text-2xl font-bold tracking-[0.2rem] uppercase'>
              Now Serving
            </h1>

            <div className='mt-4 rounded-[1.8rem]
            bg-gradient-to-r from-sky-300 to-yellow-200
            py-8 shadow-2xl'>

              {/* TOKEN */}
              <h1 className='text-center text-[5rem] md:text-[8rem] xl:text-[15rem]
              font-extrabold text-slate-800 leading-none animate-pulse'>

                {currentPatient
                  ? currentPatient.tokenNumber
                  : "--"}

              </h1>

              {/* TIME */}
              <h1 className='text-2xl text-slate-800 text-center font-bold mt-8'>

                Remaining Time :

                <span>

                  {currentPatient
                    ? ` ${currentPatient.remainingTime} mins`
                    : " -- mins"}

                </span>

              </h1>

              {/* EMERGENCY */}
              {currentPatient?.isEmergency && (

                <div className='flex justify-center mt-5'>

                  <div className='bg-red-500 text-white px-6 py-2 rounded-full font-bold animate-pulse shadow-xl'>
                    🚨 Emergency Case
                  </div>

                </div>

              )}

            </div>

          </div>



          {/* RIGHT SIDE */}
          <div className='w-full xl:w-[40%] flex flex-col gap-4'>

            {/* UPCOMING */}
            <div className='rounded-[2rem]
            bg-white/10 backdrop-blur-xl border border-white/20
            shadow-2xl p-5 md:p-6'>

              <h1 className='text-white text-xl md:text-2xl font-bold mb-5 text-center'>
                Upcoming Queue
              </h1>

              <div className='flex flex-col gap-4 max-h-[500px] overflow-y-auto'>

                {upcomingPatients.length > 0 ? (

                  upcomingPatients.map((patient, index) => {

                    let waitTime = 0;

                    // CURRENT PATIENT TIME
                    if (currentPatient) {

                      waitTime += Number(
                        currentPatient.remainingTime || 0
                      );

                    }

                    // PREVIOUS PATIENTS TIME
                    for (
                      let i = 0;
                      i < index;
                      i++
                    ) {

                      waitTime += Number(
                        upcomingPatients[i]
                          .consultationTime || 0
                      );

                    }

                    return (

                      <div
                        key={patient._id}
                        className='rounded-3xl
                        bg-gradient-to-r from-sky-300 to-yellow-200
                        p-4 flex items-center justify-between shadow-xl'
                      >

                        <div>

                          <h1 className='text-3xl font-extrabold text-slate-800'>
                            Token {patient.tokenNumber}
                          </h1>

                          <p className='text-slate-700 font-semibold mt-1'>
                            {patient.name}
                          </p>

                          {patient.isEmergency && (

                            <p className='text-red-600 font-bold mt-1'>
                              Emergency
                            </p>

                          )}

                        </div>

                        <div className='text-right'>

                          <h1 className='text-2xl font-bold text-slate-800'>

                            ~{waitTime} mins

                          </h1>

                          <p className='text-slate-700 text-sm'>
                            Estimated
                          </p>

                        </div>

                      </div>

                    );

                  })

                ) : (

                  <div className='text-center text-slate-300 py-10'>
                    No Waiting Patients
                  </div>

                )}

              </div>

            </div>



            {/* AVG */}
            <div className='rounded-[2rem]
            bg-white/10 backdrop-blur-xl border border-white/20
            shadow-2xl p-5 md:p-6'>

              <h1 className='text-white text-xl md:text-2xl font-bold text-center'>
                Average Consultation Time
              </h1>

              <h1 className='text-[3rem] md:text-[4rem]
              font-extrabold text-center mt-3
              bg-gradient-to-r from-sky-300 to-yellow-200
              bg-clip-text text-transparent'>

                {avgTime} mins

              </h1>

            </div>

          </div>

        </div>

      </div>

    </div>

  )

}

export default Patient_dashboard

