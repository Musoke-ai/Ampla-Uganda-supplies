import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import { Form, InputGroup, FormControl, ListGroup, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { selectEmployees } from '../../features/api/employeesSlice';
import { useAddEmployeeDailyListMutation, selectEmployeeDailyList } from '../../features/api/dailyEmployeesList';

/**
 * EmployeeSelector component allows users to toggle active filter, search, select employees,
 * enter role & payroll, and submit selected data.
 *
 * Props:
 * - employees: Array of employee objects { empID, empName, empStatus, empRole?, empSalary? }
 * - onSelectionChange: callback(selectedIds: Array)
 * - onDetailsChange: callback(details: { [id]: { role, payroll } })
 * - onSubmit: callback(payload: Array) when Submit is clicked
 */
const EmployeeSelector = ({
  onSelectionChange,
  onDetailsChange,
  onSubmit
}) => {
  const dailyList = useSelector(selectEmployeeDailyList);
  const _employees = useSelector(selectEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const today = new Date().toISOString().split('T')[0];

const todayList = dailyList.filter(list => {
  const createdDate = new Date(list.dailyEmployeeDateCreated).toISOString().split('T')[0];
  return createdDate === today;
});

const todayEmpIDs = todayList.map(list => list.empID); // Extract empID list
console.log("IDs: "+todayEmpIDs);

const employees = _employees.filter(emp => !todayEmpIDs.includes(emp.empID)); // Filter those not in today's list
console.log("Emps: "+employees.map(emp=>emp.empID));

  const [saveList, {isLoading, isError, error, isSuccess}] = useAddEmployeeDailyListMutation();

  // Base list based on active toggle
  const baseList = useMemo(() => {
    if (!Array.isArray(employees)) return [];
    return showActiveOnly
      ? employees.filter(e => Number(e.empStatus) === 1)
      : employees;
  }, [employees, showActiveOnly]);

  // Search/filter
  const filtered = useMemo(() => {
    if (searchTerm) {
      const fuse = new Fuse(baseList, { keys: ['empName'], threshold: 0.3 });
      return fuse.search(searchTerm).map(r => r.item);
    }
    return baseList;
  }, [searchTerm, baseList]);

  // Helper: default detail
  const getDefaultDetail = (id, field) => {
    const emp = employees.find(e => e.empID === id) || {};
    return field === 'role' ? (emp.empRole || '') : (emp.empSalary || '');
  };

  // Handle select toggle
  const handleCheckboxChange = id => {
    setSelectedIds(prev => {
      const isSel = prev.includes(id);
      const updatedIds = isSel ? prev.filter(i => i !== id) : [...prev, id];

      setEmployeeDetails(details => {
        let newDetails;
        if (isSel) {
          const { [id]: _, ...rest } = details;
          newDetails = rest;
        } else {
          newDetails = {
            ...details,
            [id]: {
              role: getDefaultDetail(id, 'role'),
              payroll: getDefaultDetail(id, 'payroll')
            }
          };
        }
        onDetailsChange(newDetails);
        return newDetails;
      });

      onSelectionChange(updatedIds);
      return updatedIds;
    });
  };

  // Handle input change
  const handleDetailChange = (id, field, value) => {
    const val = value === '' ? getDefaultDetail(id, field) : value;
    setEmployeeDetails(prev => {
      const updated = {
        ...prev,
        [id]: { ...prev[id], [field]: val }
      };
      onDetailsChange(updated);
      return updated;
    });
  };

  // Build payload and submit
  const handleSubmit = async() => {
    const payload = selectedIds.map(id => {
      const emp = employees.find(e => e.empID === id) || {};
      const details = employeeDetails[id] || {};
      return {
        id:     emp.empID,
        role:   details.role,
        pay: details.payroll
      };
    });
    // console.log("PayLoad: "+payload.map((emp) => {return emp.empName}));
    // onSubmit(payload);
    try{
const saving = await saveList({...payload}).unwrap();
setSelectedIds([]);
setEmployeeDetails({});
    }catch(error){
        console.log("Error: "+error);
    }

  };

  return (
    <div>
      <Form.Check
        type="switch"
        id="toggle-active"
        label="Show active only"
        className="mb-3"
        checked={showActiveOnly}
        onChange={() => setShowActiveOnly(!showActiveOnly)}
      />

      <InputGroup className="mb-3">
        <FormControl
          placeholder="Search employees..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          aria-label="Search employees"
        />
      </InputGroup>

      <ListGroup style={{ maxHeight: 400, overflowY: 'auto' }}>
        {filtered?.filter(e=>e.empName.length!=0).map(emp => {
          const { empID, empName } = emp;
          const isSelected = selectedIds.includes(empID);
          const details = employeeDetails[empID] || {
            role: getDefaultDetail(empID, 'role'),
            payroll: getDefaultDetail(empID, 'payroll')
          };

          return (
            <ListGroup.Item key={empID}>
              <Form.Check
                type="checkbox"
                id={`emp-checkbox-${empID}`}
                label={empName}
                checked={isSelected}
                onChange={() => handleCheckboxChange(empID)}
              />

              {isSelected && (
                <div className="mt-2 ms-4">
                  <Form.Group controlId={`role-${empID}`} className="mb-2">
                    <Form.Label>Role</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter role"
                      value={details.role}
                      onChange={e => handleDetailChange(empID, 'role', e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group controlId={`payroll-${empID}`}>  
                    <Form.Label>Payroll</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Enter payroll amount"
                      value={details.payroll}
                      onChange={e => handleDetailChange(empID, 'payroll', e.target.value)}
                    />
                  </Form.Group>
                </div>
              )}
            </ListGroup.Item>
          );
        })}
        {filtered.length === 0 && (
          <ListGroup.Item className="text-muted">No employees found.</ListGroup.Item>
        )}
      </ListGroup>

      <div className="mt-3 text-end">
        {isLoading?<Button >
          Saving List...
        </Button>:<Button onClick={handleSubmit} disabled={selectedIds.length === 0}>
          Save List
        </Button>}
      </div>
    </div>
  );
};

EmployeeSelector.propTypes = {
  employees: PropTypes.arrayOf(
    PropTypes.shape({
      empID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      empName: PropTypes.string.isRequired,
      empStatus: PropTypes.number.isRequired,
      empRole: PropTypes.string,
      empSalary: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ).isRequired,
  onSelectionChange: PropTypes.func,
  onDetailsChange: PropTypes.func,
  onSubmit: PropTypes.func
};

EmployeeSelector.defaultProps = {
  onSelectionChange: () => {},
  onDetailsChange: () => {},
  onSubmit: () => {}
};

export default EmployeeSelector;
