import asyncio
import base64
from concurrent.futures import ThreadPoolExecutor
from http.client import HTTPResponse
import io
import mimetypes
from time import time
from tracemalloc import start
import cv2
import numpy as np
import dlib
from flask import request, send_file, Flask, render_template, jsonify
from flask_cors import CORS, cross_origin

app = Flask(__name__)

cors = CORS(app, resources={r"/": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'


def extract_index_nparray(nparray):
    index = None
    for num in nparray[0]:
        index = num
        break
    return index
	
@app.route('/swapper', methods=['POST'])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def Swapper():
    #read image file string data
    filestr1 = request.files['srcFile'].read()
    filestr2 = request.files['destFile'].read()
    #convert string data to numpy array
    npimg1 = np.fromstring(filestr1, np.uint8)
    npimg2 = np.fromstring(filestr2, np.uint8)
    # convert numpy array to image
    img = cv2.imdecode(npimg1, cv2.IMREAD_COLOR)
    img2 = cv2.imdecode(npimg2, cv2.IMREAD_COLOR)
    #convert to gray
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img2_gray = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
    #create empty mask
    mask = np.zeros_like(img_gray)
    height, width, channels = img2.shape
    img2_new_face = np.zeros((height, width, channels), np.uint8)
    #load face detector
    detector = dlib.get_frontal_face_detector()
    #detect faces in the source image
    predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
    # Face 1
    faces = detector(img_gray)
    for face in faces:
        #find the landmarks
        landmarks = predictor(img_gray, face)
        #stock them into a list
        landmarks_points = []
        for n in range(0, 68):
            x = landmarks.part(n).x
            y = landmarks.part(n).y
            landmarks_points.append((x, y))
            #draw points
            #cv2.circle(img, (x,y), 3, (0,0,255), -1)
            #opencv do not work with straight simple arrays proposed by python 
            #so we should convert landmarks_points list to a numpy array (bc numpy is fast)
        points = np.array(landmarks_points, np.int32)
        # cv2.polylines(img, [convexhull], True, (255, 0, 0), 3)
        #create the convexhull
        convexhull= cv2.convexHull(points)
        #draw the polygon using points
        #cv2.polylines(img, [convexhull], True, (0,0,255), 2)
        #create white mask to the convexhull 
        face_image_1 = cv2.bitwise_and(img, img, mask=mask)

        # Delaunay triangulation
        rect = cv2.boundingRect(convexhull)
        #extract points to draw the rectangle
        # (x,y,w,h)= rect
        # cv2.rectangle(img, (x, y), (x+w, y+h), (0,255,0), 2)
        subdiv = cv2.Subdiv2D(rect)
        subdiv.insert(landmarks_points)
        #create triangles
        triangles = subdiv.getTriangleList()
        #draw triangles on the face
        triangles = np.array(triangles, dtype=np.int32)

        indexes_triangles = []
        for t in triangles:
            #extract points
            pt1 = (t[0], t[1])
            pt2 = (t[2], t[3])
            pt3 = (t[4], t[5])

            #create and extract indexes
            index_pt1 = np.where((points == pt1).all(axis=1))
            index_pt1 = extract_index_nparray(index_pt1)

            index_pt2 = np.where((points == pt2).all(axis=1))
            index_pt2 = extract_index_nparray(index_pt2)

            index_pt3 = np.where((points == pt3).all(axis=1))
            index_pt3 = extract_index_nparray(index_pt3)

            if index_pt1 is not None and index_pt2 is not None and index_pt3 is not None:
                triangle = [index_pt1, index_pt2, index_pt3]
                indexes_triangles.append(triangle)



    # Face 2
    faces2 = detector(img2_gray)
    for face in faces2:
        #find the landmarks
        landmarks = predictor(img2_gray, face)
        #stock them into a list
        landmarks_points2 = []
        for n in range(0, 68):
            x = landmarks.part(n).x
            y = landmarks.part(n).y
            landmarks_points2.append((x, y))
            #draw points
            #cv2.circle(img2, (x,y), 3, (0,0,255), -1)

        points2 = np.array(landmarks_points2, np.int32)
        convexhull2 = cv2.convexHull(points2)

    lines_space_mask = np.zeros_like(img_gray)
    lines_space_new_face = np.zeros_like(img2)
    # Triangulation of both faces
    for triangle_index in indexes_triangles:
        # Triangulation of the source face
        tr1_pt1 = landmarks_points[triangle_index[0]]
        tr1_pt2 = landmarks_points[triangle_index[1]]
        tr1_pt3 = landmarks_points[triangle_index[2]]
        triangle1 = np.array([tr1_pt1, tr1_pt2, tr1_pt3], np.int32)

        rect1 = cv2.boundingRect(triangle1)
        (x, y, w, h) = rect1
        #extract triangle
        cropped_triangle = img[y: y + h, x: x + w]
        cropped_tr1_mask = np.zeros((h, w), np.uint8)


        points = np.array([[tr1_pt1[0] - x, tr1_pt1[1] - y],
                        [tr1_pt2[0] - x, tr1_pt2[1] - y],
                        [tr1_pt3[0] - x, tr1_pt3[1] - y]], np.int32)

        cv2.fillConvexPoly(cropped_tr1_mask, points, 255)

        # Lines space
        cv2.line(lines_space_mask, tr1_pt1, tr1_pt2, 255)
        cv2.line(lines_space_mask, tr1_pt2, tr1_pt3, 255)
        cv2.line(lines_space_mask, tr1_pt1, tr1_pt3, 255)
        lines_space = cv2.bitwise_and(img, img, mask=lines_space_mask)

        # Triangulation of destination face
        tr2_pt1 = landmarks_points2[triangle_index[0]]
        tr2_pt2 = landmarks_points2[triangle_index[1]]
        tr2_pt3 = landmarks_points2[triangle_index[2]]
        triangle2 = np.array([tr2_pt1, tr2_pt2, tr2_pt3], np.int32)


        rect2 = cv2.boundingRect(triangle2)
        (x, y, w, h) = rect2
        # extract triangle
        cropped_tr2_mask = np.zeros((h, w), np.uint8)

        points2 = np.array([[tr2_pt1[0] - x, tr2_pt1[1] - y],
                            [tr2_pt2[0] - x, tr2_pt2[1] - y],
                            [tr2_pt3[0] - x, tr2_pt3[1] - y]], np.int32)

        cv2.fillConvexPoly(cropped_tr2_mask, points2, 255)

        # Warp triangles
        points = np.float32(points)
        points2 = np.float32(points2)
        M = cv2.getAffineTransform(points, points2)
        warped_triangle = cv2.warpAffine(cropped_triangle, M, (w, h))
        warped_triangle = cv2.bitwise_and(warped_triangle, warped_triangle, mask=cropped_tr2_mask)

        # Reconstructing destination face
        img2_new_face_rect_area = img2_new_face[y: y + h, x: x + w]
        img2_new_face_rect_area_gray = cv2.cvtColor(img2_new_face_rect_area, cv2.COLOR_BGR2GRAY)
        _, mask_triangles_designed = cv2.threshold(img2_new_face_rect_area_gray, 1, 255, cv2.THRESH_BINARY_INV)
        warped_triangle = cv2.bitwise_and(warped_triangle, warped_triangle, mask=mask_triangles_designed)

        img2_new_face_rect_area = cv2.add(img2_new_face_rect_area, warped_triangle)
        img2_new_face[y: y + h, x: x + w] = img2_new_face_rect_area



    # Face swapped (putting 1st face into 2nd face)
    img2_face_mask = np.zeros_like(img2_gray)
    img2_head_mask = cv2.fillConvexPoly(img2_face_mask, convexhull2, 255)
    img2_face_mask = cv2.bitwise_not(img2_head_mask)


    img2_head_noface = cv2.bitwise_and(img2, img2, mask=img2_face_mask)
    result = cv2.add(img2_head_noface, img2_new_face)

    (x, y, w, h) = cv2.boundingRect(convexhull2)
    center_face2 = (int((x + x + w) / 2), int((y + y + h) / 2))

    seamlessclone = cv2.seamlessClone(result, img2, img2_head_mask, center_face2, cv2.NORMAL_CLONE)
    cv2.imwrite('result.jpg', seamlessclone)
    
    # cv2.imshow("seamlessclone", seamlessclone)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()
    # print('processed_string')
    # await asyncio.sleep(10)
    # print('yes')
    # results = base64.b64encode(seamlessclone)
    # await asyncio.sleep(14)
    # return results
    # return base64.b64encode(seamlessclone)
    # return {'data' : processed_string}
    return send_file('result.jpg')

@app.route('/img',methods = ['POST'])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def Filter():
    #path to classifiers
    path = 'data/haarcascades/'
    #get image classifiers
    face_cascade = cv2.CascadeClassifier(path +'haarcascade_frontalface_default.xml')
    eye_cascade = cv2.CascadeClassifier(path +'haarcascade_eye.xml')
   

    #read image file string data
    filestr1 = request.files['srcFile'].read()
    filestr2 = request.files['destFile'].read()
    #convert string data to numpy array
    npimg1 = np.fromstring(filestr1, np.uint8)
    npimg2 = np.fromstring(filestr2, np.uint8)
     # convert numpy array to image
    img = cv2.imdecode(npimg1, cv2.IMREAD_COLOR)
    hat = cv2.imdecode(npimg2, cv2.IMREAD_COLOR)
    #get shape of hat
    original_hat_h,original_hat_w,hat_channels = hat.shape
    #get shape of img
    img_h,img_w,img_channels = img.shape
    #convert to gray (Haar Cascades and many facial recognition algorithms require images to be in grayscale)
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hat_gray = cv2.cvtColor(hat, cv2.COLOR_BGR2GRAY)
    #create mask and inverse mask of hat
    #Note: I used THRESH_BINARY_INV because the image was already on 
    #transparent background, try cv2.THRESH_BINARY if you are using a white background
    ret, original_mask = cv2.threshold(hat_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    original_mask_inv = cv2.bitwise_not(original_mask)
    #find faces in image using classifier
    faces = face_cascade.detectMultiScale(img_gray, 1.3, 5)
    for (x,y,w,h) in faces:
        #retangle for testing purposes
        #img = cv2.rectangle(img,(x,y),(x+w,y+h),(255,0,0),2)
        #coordinates of face region
        face_w = w
        face_h = h
        face_x1 = x
        face_x2 = face_x1 + face_w
        face_y1 = y
        face_y2 = face_y1 + face_h
        #hat size in relation to face by scaling
        hat_width = int(1.5 * face_w)
        hat_height = int(hat_width * original_hat_h / original_hat_w)
        #setting location of coordinates of hat
        hat_x1 = face_x2 - int(face_w/1.7) - int(hat_width/2)
        hat_x2 = hat_x1 + hat_width
        hat_y1 = face_y1 - int(face_h*1.3)
        hat_y2 = hat_y1 + hat_height 
        #check to see if out of frame
        if hat_x1 < 0:
            hat_x1 = 0
        if hat_y1 < 0:
            hat_y1 = 0
        if hat_x2 > img_w:
            hat_x2 = img_w
        if hat_y2 > img_h:
            hat_y2 = img_h
        #Account for any out of frame changes
        hat_width = hat_x2 - hat_x1
        hat_height = hat_y2 - hat_y1
        #resize hat to fit on face
        hat = cv2.resize(hat, (hat_width,hat_height), interpolation = cv2.INTER_AREA)
        mask = cv2.resize(original_mask, (hat_width,hat_height), interpolation = cv2.INTER_AREA)
        mask_inv = cv2.resize(original_mask_inv, (hat_width,hat_height), interpolation = cv2.INTER_AREA)
        #take ROI for hat from background that is equal to size of hat image
        roi = img[hat_y1:hat_y2, hat_x1:hat_x2]
        #original image in background (bg) where hat is not present
        roi_bg = cv2.bitwise_and(roi,roi,mask = mask)
        roi_fg = cv2.bitwise_and(hat,hat,mask=mask_inv)
        dst = cv2.add(roi_bg,roi_fg)
        #put back in original image
        img[hat_y1:hat_y2, hat_x1:hat_x2] = dst
    # cv2.imshow('img',img) #display image
    cv2.imwrite('res2.jpg', img)
    # cv2.waitKey(0) #wait until key is pressed to proceed
    # cv2.destroyAllWindows() #close all windows
    return send_file('res2.jpg')