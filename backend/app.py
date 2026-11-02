from flask import Flask, jsonify, request
from flask_cors import CORS
from database import get_db_connection

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({
        "message": "Aegis Health System Backend is running"
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "backend": "Flask",
        "project": "Aegis Health System"
    })


@app.route("/api/db-test")
def db_test():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT DATABASE()")
        database = cursor.fetchone()[0]

        return jsonify({
            "status": "success",
            "database": database,
            "message": "Flask connected to MySQL successfully"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.route("/api/patients")
def get_patients():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                p.patient_id,
                p.patient_name,
                p.date_of_birth,
                p.gender,
                p.phone,
                p.email,
                p.address,
                p.blood_group,
                p.national_id,
                p.allergies,
                p.chronic_conditions,
                p.emergency_contact_name,
                p.emergency_contact_relationship,
                p.emergency_contact_phone,

                v.visit_id,
                v.visit_date,
                v.visit_type,
                v.symptoms,
                v.notes,
                v.triage_level,
                v.diagnosis,
                v.prescription,

                d.doctor_name,
                d.specialization,
                dep.department_name

            FROM patients p

            LEFT JOIN visits v
                ON p.patient_id = v.patient_id

            LEFT JOIN doctors d
                ON v.doctor_id = d.doctor_id

            LEFT JOIN departments dep
                ON d.department_id = dep.department_id

            ORDER BY
                p.patient_id,
                v.visit_date DESC
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        patients = {}

        for row in rows:
            patient_id = row["patient_id"]

            if patient_id not in patients:
                patients[patient_id] = {
                    "patient_id": patient_id,
                    "patient_name": row["patient_name"],
                    "date_of_birth": (
                        str(row["date_of_birth"])
                        if row["date_of_birth"]
                        else None
                    ),
                    "gender": row["gender"],
                    "phone": row["phone"],
                    "email": row["email"],
                    "address": row["address"],
                    "blood_group": row["blood_group"],
                    "national_id": row["national_id"],
                    "allergies": row["allergies"],
                    "chronic_conditions": row["chronic_conditions"],
                    "emergency_contact_name": row["emergency_contact_name"],
                    "emergency_contact_relationship": row[
                        "emergency_contact_relationship"
                    ],
                    "emergency_contact_phone": row[
                        "emergency_contact_phone"
                    ],
                    "visits": []
                }

            if row["visit_id"] is not None:
                patients[patient_id]["visits"].append({
                    "visit_id": row["visit_id"],
                    "visit_date": (
                        str(row["visit_date"])
                        if row["visit_date"]
                        else None
                    ),
                    "visit_type": row["visit_type"],
                    "symptoms": row["symptoms"],
                    "notes": row["notes"],
                    "triage_level": row["triage_level"],
                    "diagnosis": row["diagnosis"],
                    "prescription": row["prescription"],
                    "doctor_name": row["doctor_name"],
                    "specialization": row["specialization"],
                    "department": row["department_name"]
                })

        patient_list = list(patients.values())

        return jsonify({
            "status": "success",
            "count": len(patient_list),
            "patients": patient_list
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.route("/api/patients", methods=["POST"])
def create_patient():
    connection = None
    cursor = None

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required"
            }), 400

        if not data.get("patient_name"):
            return jsonify({
                "status": "error",
                "message": "Patient name is required"
            }), 400

        if not data.get("phone"):
            return jsonify({
                "status": "error",
                "message": "Phone number is required"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO patients (
                patient_name,
                date_of_birth,
                gender,
                phone,
                email,
                blood_group,
                address,
                national_id,
                allergies,
                chronic_conditions,
                emergency_contact_name,
                emergency_contact_relationship,
                emergency_contact_phone
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """

        values = (
            data.get("patient_name"),
            data.get("date_of_birth"),
            data.get("gender"),
            data.get("phone"),
            data.get("email"),
            data.get("blood_group"),
            data.get("address"),
            data.get("national_id"),
            data.get("allergies"),
            data.get("chronic_conditions"),
            data.get("emergency_contact_name"),
            data.get("emergency_contact_relationship"),
            data.get("emergency_contact_phone")
        )

        cursor.execute(query, values)
        connection.commit()

        patient_id = cursor.lastrowid

        return jsonify({
            "status": "success",
            "message": "Patient registered successfully",
            "patient_id": patient_id
        }), 201

    except Exception as e:

        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.route("/api/patient-intake", methods=["POST"])
def create_patient_intake():
    connection = None
    cursor = None

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required"
            }), 400

        required_fields = [
            "patient_name",
            "phone",
            "date_of_birth",
            "gender",
            "doctor_id"
        ]

        missing_fields = [
            field for field in required_fields
            if data.get(field) in (None, "")
        ]

        if missing_fields:
            return jsonify({
                "status": "error",
                "message": "Missing required fields",
                "fields": missing_fields
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        # ---------------------------------------------------------
        # 1. Verify that the selected doctor actually exists
        # ---------------------------------------------------------

        cursor.execute(
            """
            SELECT
                doctor_id,
                doctor_name,
                department_id
            FROM doctors
            WHERE doctor_id = %s
            """,
            (data.get("doctor_id"),)
        )

        doctor = cursor.fetchone()

        if not doctor:
            return jsonify({
                "status": "error",
                "message": "Selected doctor does not exist"
            }), 400

        doctor_id = doctor[0]
        doctor_name = doctor[1]
        department_id = doctor[2]

        # ---------------------------------------------------------
        # 2. Insert patient
        # ---------------------------------------------------------

        patient_query = """
            INSERT INTO patients (
                patient_name,
                date_of_birth,
                gender,
                phone,
                email,
                blood_group,
                address,
                national_id,
                allergies,
                chronic_conditions,
                emergency_contact_name,
                emergency_contact_relationship,
                emergency_contact_phone
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """

        patient_values = (
            data.get("patient_name"),
            data.get("date_of_birth"),
            data.get("gender"),
            data.get("phone"),
            data.get("email"),
            data.get("blood_group"),
            data.get("address"),
            data.get("national_id"),
            data.get("allergies"),
            data.get("chronic_conditions"),
            data.get("emergency_contact_name"),
            data.get("emergency_contact_relationship"),
            data.get("emergency_contact_phone")
        )

        cursor.execute(patient_query, patient_values)

        patient_id = cursor.lastrowid

        # ---------------------------------------------------------
        # 3. Insert first visit
        # ---------------------------------------------------------

        visit_query = """
            INSERT INTO visits (
                patient_id,
                doctor_id,
                visit_date,
                visit_type,
                symptoms,
                notes,
                triage_level,
                diagnosis,
                prescription
            )
            VALUES (
                %s,
                %s,
                NOW(),
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """

        visit_values = (
            patient_id,
            doctor_id,
            data.get("visit_type", "Outpatient"),
            data.get("chief_complaint"),
            data.get("clinical_notes"),
            data.get("triage_level"),
            data.get("diagnosis"),
            data.get("prescription")
        )

        cursor.execute(visit_query, visit_values)

        visit_id = cursor.lastrowid

        # ---------------------------------------------------------
        # 4. Insert measurements
        # ---------------------------------------------------------

        measurements = []

        bp = data.get("blood_pressure")

        if bp:
            bp_parts = str(bp).split("/")

            if len(bp_parts) == 2:
                try:
                    systolic = float(bp_parts[0].strip())
                    diastolic = float(bp_parts[1].strip())

                    measurements.append((
                        patient_id,
                        "Blood Pressure Systolic",
                        systolic,
                        "mmHg"
                    ))

                    measurements.append((
                        patient_id,
                        "Blood Pressure Diastolic",
                        diastolic,
                        "mmHg"
                    ))

                except ValueError:
                    return jsonify({
                        "status": "error",
                        "message": "Blood pressure must be in the format 120/80"
                    }), 400

        if data.get("heart_rate") not in (None, ""):
            measurements.append((
                patient_id,
                "Heart Rate",
                float(data.get("heart_rate")),
                "bpm"
            ))

        if data.get("oxygen_saturation") not in (None, ""):
            measurements.append((
                patient_id,
                "Oxygen Saturation",
                float(data.get("oxygen_saturation")),
                "%"
            ))

        if data.get("temperature") not in (None, ""):
            measurements.append((
                patient_id,
                "Temperature",
                float(data.get("temperature")),
                "F"
            ))

        if data.get("weight") not in (None, ""):
            measurements.append((
                patient_id,
                "Weight",
                float(data.get("weight")),
                "kg"
            ))

        measurement_query = """
            INSERT INTO measurements (
                patient_id,
                measurement_type,
                measurement_value,
                unit
            )
            VALUES (
                %s,
                %s,
                %s,
                %s
            )
        """

        for measurement in measurements:
            cursor.execute(measurement_query, measurement)

        # ---------------------------------------------------------
        # 5. Commit everything together
        # ---------------------------------------------------------

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Patient intake completed successfully",
            "patient_id": patient_id,
            "visit_id": visit_id,
            "doctor_id": doctor_id,
            "doctor_name": doctor_name,
            "department_id": department_id,
            "measurements_saved": len(measurements)
        }), 201

    except ValueError:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": "One or more measurement values are invalid"
        }), 400

    except Exception as e:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.route("/api/visits")
def get_visits():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                v.visit_id,
                v.patient_id,
                p.patient_name,
                v.doctor_id,
                d.doctor_name,
                d.specialization,
                dep.department_name,
                v.visit_date,
                v.visit_type,
                v.symptoms,
                v.notes,
                v.triage_level,
                v.diagnosis,
                v.prescription

            FROM visits v

            JOIN patients p
                ON v.patient_id = p.patient_id

            JOIN doctors d
                ON v.doctor_id = d.doctor_id

            JOIN departments dep
                ON d.department_id = dep.department_id

            ORDER BY v.visit_date DESC
        """

        cursor.execute(query)
        visits = cursor.fetchall()

        return jsonify({
            "status": "success",
            "count": len(visits),
            "visits": visits
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.route("/api/disease-reports")
def get_disease_reports():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                p.patient_id,
                p.patient_name,
                d.disease_id,
                d.disease_name,
                d.description,
                pd.diagnosed_date,
                pd.status

            FROM patient_diseases pd

            JOIN patients p
                ON pd.patient_id = p.patient_id

            JOIN diseases d
                ON pd.disease_id = d.disease_id

            ORDER BY
                d.disease_name,
                p.patient_id
        """

        cursor.execute(query)
        reports = cursor.fetchall()

        for report in reports:
            if report["diagnosed_date"]:
                report["diagnosed_date"] = str(
                    report["diagnosed_date"]
                )

        return jsonify({
            "status": "success",
            "count": len(reports),
            "reports": reports
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.route("/api/hologram-risk")
def get_hologram_risk():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                p.patient_id,
                p.patient_name,

                dep.department_id,
                dep.department_name,

                ri.risk_id,
                ri.risk_level,
                ri.risk_score,
                ri.indicator,
                ri.created_at,

                m.measurement_id,
                m.measurement_type,
                m.measurement_value,
                m.unit,
                m.measured_at

            FROM patients p

            LEFT JOIN risk_indicators ri
                ON p.patient_id = ri.patient_id

            LEFT JOIN departments dep
                ON ri.department_id = dep.department_id

            LEFT JOIN measurements m
                ON p.patient_id = m.patient_id

            ORDER BY
                p.patient_id,
                m.measured_at DESC
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        patients = {}

        for row in rows:
            patient_id = row["patient_id"]

            if patient_id not in patients:
                patients[patient_id] = {
                    "patient_id": patient_id,
                    "patient_name": row["patient_name"],
                    "department_id": row["department_id"],
                    "department_name": row["department_name"],
                    "risk": None,
                    "measurements": []
                }

            if row["risk_id"] is not None:
                patients[patient_id]["risk"] = {
                    "risk_id": row["risk_id"],
                    "risk_level": row["risk_level"],
                    "risk_score": (
                        float(row["risk_score"])
                        if row["risk_score"] is not None
                        else None
                    ),
                    "indicator": row["indicator"],
                    "created_at": (
                        str(row["created_at"])
                        if row["created_at"]
                        else None
                    )
                }

            if row["measurement_id"] is not None:
                patients[patient_id]["measurements"].append({
                    "measurement_id": row["measurement_id"],
                    "measurement_type": row["measurement_type"],
                    "measurement_value": (
                        float(row["measurement_value"])
                        if row["measurement_value"] is not None
                        else None
                    ),
                    "unit": row["unit"],
                    "measured_at": (
                        str(row["measured_at"])
                        if row["measured_at"]
                        else None
                    )
                })

        patient_list = list(patients.values())

        return jsonify({
            "status": "success",
            "count": len(patient_list),
            "patients": patient_list
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )