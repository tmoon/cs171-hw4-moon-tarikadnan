import json as js
from datetime import datetime

def initialize():
	return {\
      "sum": 0,\
      "hourly": {"01:00:00 AM": 0, "02:00:00 AM": 0, "03:00:00 AM": 0, "04:00:00 AM": 0, "05:00:00 AM": 0, "06:00:00 AM": 0, "07:00:00 AM": 0, "08:00:00 AM": 0, "09:00:00 AM": 0, "10:00:00 AM": 0, "11:00:00 AM": 0, "12:00:00 PM": 0, "01:00:00 PM": 0, "02:00:00 PM": 0, "03:00:00 PM": 0, "04:00:00 PM": 0, "05:00:00 PM": 0, "06:00:00 PM": 0, "07:00:00 PM": 0, "08:00:00 PM": 0, "09:00:00 PM": 0, "10:00:00 PM": 0, "11:00:00 PM": 0, "12:00:00 AM": 0} }

def process(s):
	pass

f = open('allData2003_2004.json','r').read()

data = js.loads(f)

small_data = {}


for s in data:
	small_data[s] = initialize()

	# if len(data[s]) == 0:
	# 	continue
	# print data[s][0]
	for dt in data[s]:
		d = dt["date"]
		val = dt["value"]
		small_data[s]["sum"] += val

		d_obj = datetime.strptime(d,'%b %d, %Y %I:%M:%S %p')
		key = d_obj.strftime("%I:%M:%S %p")
		small_data[s]["hourly"][key] += val

with open('reducedMonthStationHour2003_2004.json', 'w') as outfile:
  js.dump(small_data, outfile, sort_keys=True, indent=4)