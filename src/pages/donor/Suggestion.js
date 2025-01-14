import { useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from 'react';
import app from '../../firebase';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import Sidebar from '../../components/Sidebar';

// icons
import { IoCaretBack } from "react-icons/io5";
import { IoCaretForward } from "react-icons/io5";

const Suggestion = () => {

    const location = useLocation();
    const role = location.state?.role || localStorage.getItem('userRole');

    const db = getFirestore(app);

    const [history, setHistory] = useState([]);
    const [weekData, setWeekData] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState("Sem 1");

    const handleToggle = () => {
        const nextSemester = selectedSemester === "Sem 1" ? "Sem 2" : "Sem 1";
        setSelectedSemester(nextSemester);
    };

    const fetchHistory = async () => {
        const snapshot = await getDocs(collection(db, "recipientRequests"));
        const rawData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        const groupedData = rawData.reduce((acc, item) => {
            const { productName, category } = item;
    
            if (!acc[productName]) {
                acc[productName] = {
                    productName,
                    category,
                    count: 0,
                };
            }
    
            acc[productName].count += 1;
    
            return acc;
        }, {});

        const data = Object.values(groupedData).sort((a, b) => b.count - a.count);

        setHistory(data);
    };

    const fetchWeekData = async () => {
        const snapshot = await getDocs(collection(db, "weekRequiredItem"));
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        const today = new Date();
        
        const getStartDate = (item) =>
            selectedSemester === "Sem 1" ? new Date(item.sem1StartDate) : new Date(item.sem2StartDate);
        const getEndDate = (item) =>
            selectedSemester === "Sem 1" ? new Date(item.sem1EndDate) : new Date(item.sem2EndDate);
    
        const isTodayInRange = (item) => {
            const startDate = getStartDate(item);
            const endDate = getEndDate(item);
            return today >= startDate && today <= endDate;
        };
    
        // Find today's week
        let todayWeek = null;
        data.forEach((item) => {
            if (isTodayInRange(item)) {
                todayWeek = item.week; // Save today's week number
            }
        });
    
        // Default to ascending sort by week if todayWeek is not found
        const sortedData = data.sort((a, b) => a.week - b.week);
    
        if (todayWeek) {
            // Rearrange weeks starting from today's week
            const reorderedData = sortedData.filter(item => item.week >= todayWeek)
                .concat(sortedData.filter(item => item.week < todayWeek));
            setWeekData(reorderedData);
        } else {
            setWeekData(sortedData); // Fallback if todayWeek is not found
        }
    };

    const [curReqPage, setCurReqPage] = useState(1);
    const [curWeekPage, setCurWeekPage] = useState(1);
    const rowsPerPage = 5;

    const reqLastIdx = curReqPage * rowsPerPage;
    const reqFirstIdx = reqLastIdx - rowsPerPage;
    const weekLastIdx = curWeekPage * rowsPerPage;
    const weekFirstIdx = weekLastIdx - rowsPerPage;
    const curReqRows = history.slice(reqFirstIdx, reqLastIdx);
    const curWeekRows = weekData.slice(weekFirstIdx, weekLastIdx);

    const handleNextPage = (type) => {
        // if(type === 'req'){
        //     if (curReqRows.length === rowsPerPage) {
        //         setCurReqPage(curReqPage + 1);
        //       }
        // } else if (type === 'week') {
        //     if (curWeekRows.length === rowsPerPage) {
        //         setCurWeekPage(curWeekPage + 1);
        //       }
        // }
        if (type === "req" && curReqRows.length === rowsPerPage) {
            setCurReqPage((prev) => prev + 1);
          } else if (type === "week" && curWeekRows.length === rowsPerPage) {
            setCurWeekPage((prev) => prev + 1);
          }


      };

      const handlePreviousPage = (type) => {

        if (type === "req" && curReqPage > 1) {
            setCurReqPage((prev) => prev - 1);
          } else if (type === "week" && curWeekPage > 1) {
            setCurWeekPage((prev) => prev - 1);
          }

      }; 
      
    useEffect(() => {
        fetchHistory();
        fetchWeekData();
    }, [fetchHistory, fetchWeekData]);

    return(
    <div className="dashboard-layout">
      <Sidebar userRole={role}/>
      <div className="dashboard-content">
      <h1>Suggestions</h1>

        {/* Student Request Item */}
        <h2>Request Items List</h2>    
            <table>
                <thead>
                <tr>
                    <th>Item Name</th>
                    <th>Item Category</th>
                    <th>Number of Request</th>
                </tr>
                </thead>
                    <tbody>
                        { history.length === 0 ? (
                            <tr>
                                <td colSpan = '8'>No results found</td>
                            </tr>
                        ) : (
                            curReqRows.map((item) => (
                                <tr>
                                    <td>{item.productName}</td>
                                    <td>{item.category}</td>
                                    <td>{item.count}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
      
                      
                <div className='table-navigate'>
                    <button onClick={() => handlePreviousPage('req')} disabled={curReqPage === 1}>
                        <IoCaretBack />
                            Back
                    </button>
                    <p>{curReqPage}</p>
                        {curReqRows.length === rowsPerPage && (
                    <button onClick={() => handleNextPage('req')}>
                        <IoCaretForward />
                        Next
                    </button>
                    )}
                </div>




            <h2>Weekly Suggest Item</h2>    
            <button 
                    className={`toggle-button ${selectedSemester === "Sem 2" ? "active" : ""}`} 
                    onClick={handleToggle}>
                    <span className={`toggle-text ${selectedSemester === "Sem 2" ? "active" : ""}`}>
                        {selectedSemester === "Sem 1" ? "Sem 1" : "Sem 2"}
                    </span>
                </button>
            <table>
                <thead>
                <tr>
                    <th>Week</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Reference</th>
                    <th>Item Request</th>
                </tr>
                </thead>
                    <tbody>
                        { curWeekRows.map((week) => (
                            <tr key={week.id}>
                                <td>{week.week}</td>
                                <td>
                                    {selectedSemester === "Sem 1"
                                        ? week.sem1StartDate
                                        : week.sem2StartDate}
                                </td>
                                <td>
                                    {selectedSemester === "Sem 1"
                                        ? week.sem1EndDate
                                        : week.sem2EndDate}
                                </td>
                                <td>{week.reference ? week.reference : "-"}</td>
                                <td>
                                    <ul>
                                        {week.item && week.item.map((item, index) => (
                                            <li key={index}>
                                                {item.category}: {item.name}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            </tr>                            
                        )) }
                    </tbody>
                </table>

                <div className='table-navigate'>
                    <button onClick={() => handlePreviousPage('week')} disabled={curWeekPage === 1}>
                        <IoCaretBack />
                            Back
                    </button>
                    <p>{curWeekPage}</p>
                        {curWeekRows.length === rowsPerPage && (
                    <button onClick={() => handleNextPage('week')}>
                        <IoCaretForward />
                        Next
                    </button>
                    )}
                </div>
      </div>
    </div>
    );
};

export default Suggestion;